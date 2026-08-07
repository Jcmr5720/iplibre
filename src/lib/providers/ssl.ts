/**
 * Análisis real del certificado TLS de un dominio mediante una conexión
 * `node:tls` en el puerto 443. Se establece la conexión con
 * `rejectUnauthorized: false` para poder inspeccionar también certificados
 * inválidos o expirados (y reportarlos), pero la validez se evalúa a partir de
 * `socket.authorized`, `authorizationError` y `checkServerIdentity`.
 *
 * Protección SSRF: antes de conectar se verifica que el host resuelva a una IP
 * pública (assertPublicHost).
 */
import tls from "node:tls";
import { assertPublicHost, SsrfError } from "@/lib/net/ssrf";
import { classifySsl, daysUntil, type SslState } from "@/lib/ssl/thresholds";

const TIMEOUT_MS = 10_000;
const PORT = 443;

export interface SslChainCert {
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
}

export interface SslResult {
  host: string;
  found: true;
  state: SslState;
  stateLabel: string;
  valid: boolean;
  hostnameValid: boolean;
  expired: boolean;
  notYetValid: boolean;
  daysRemaining: number;
  subjectCommonName?: string;
  subjectAltNames: string[];
  issuer?: string;
  issuerOrg?: string;
  validFrom: string;
  validTo: string;
  serialNumber?: string;
  fingerprintSha256?: string;
  protocol?: string;
  authorizationError?: string;
  chain: SslChainCert[];
  checkedAt: string;
}

export type SslOutcome =
  | { ok: true; data: SslResult }
  | { ok: false; error: string; kind: "ssrf" | "dns" | "timeout" | "connection" | "no-cert" };

function parseDn(dn: Record<string, string | string[]> | undefined, key: string): string | undefined {
  if (!dn) return undefined;
  const v = dn[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function formatIssuer(issuer: Record<string, string | string[]> | undefined): {
  full?: string;
  org?: string;
} {
  if (!issuer) return {};
  const org = parseDn(issuer, "O");
  const cn = parseDn(issuer, "CN");
  const full = [org, cn].filter(Boolean).join(" — ") || undefined;
  return { full, org };
}

export async function checkSsl(host: string): Promise<SslOutcome> {
  const cleanHost = host.trim().toLowerCase().replace(/^\[|\]$/g, "");

  try {
    await assertPublicHost(cleanHost);
  } catch (err) {
    if (err instanceof SsrfError) return { ok: false, error: err.message, kind: "ssrf" };
    return { ok: false, error: "No se pudo resolver el dominio.", kind: "dns" };
  }

  return new Promise<SslOutcome>((resolve) => {
    let settled = false;
    const done = (out: SslOutcome) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* noop */
      }
      resolve(out);
    };

    const socket = tls.connect(
      {
        host: cleanHost,
        servername: cleanHost,
        port: PORT,
        rejectUnauthorized: false,
        timeout: TIMEOUT_MS,
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          return done({ ok: false, error: "El servidor no presentó un certificado.", kind: "no-cert" });
        }

        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const expired = now > validTo;
        const notYetValid = now < validFrom;
        const daysRemaining = daysUntil(validTo, now);

        // Validación de identidad de hostname.
        const identityError = tls.checkServerIdentity(cleanHost, cert);
        const hostnameValid = !identityError;

        const authorized = socket.authorized;
        const authorizationError = socket.authorizationError
          ? String(socket.authorizationError)
          : undefined;
        const valid = authorized && hostnameValid && !expired && !notYetValid;

        const { full: issuer, org: issuerOrg } = formatIssuer(
          cert.issuer as unknown as Record<string, string | string[]>,
        );

        const san = (cert.subjectaltname || "")
          .split(",")
          .map((s) => s.trim().replace(/^DNS:/i, ""))
          .filter(Boolean);

        // Cadena de certificados (evita bucles con issuerCertificate circular).
        const chain: SslChainCert[] = [];
        let node: tls.DetailedPeerCertificate | undefined = cert;
        const seen = new Set<string>();
        while (node && node.fingerprint256 && !seen.has(node.fingerprint256)) {
          seen.add(node.fingerprint256);
          chain.push({
            subject: parseDn(node.subject as unknown as Record<string, string | string[]>, "CN"),
            issuer: parseDn(node.issuer as unknown as Record<string, string | string[]>, "CN"),
            validFrom: node.valid_from,
            validTo: node.valid_to,
          });
          const next: tls.DetailedPeerCertificate | undefined = node.issuerCertificate;
          if (!next || next === node) break;
          node = next;
        }

        const classification = classifySsl({
          valid,
          hostnameValid,
          expired,
          notYetValid,
          daysRemaining,
        });

        done({
          ok: true,
          data: {
            host: cleanHost,
            found: true,
            state: classification.state,
            stateLabel: classification.label,
            valid,
            hostnameValid,
            expired,
            notYetValid,
            daysRemaining,
            subjectCommonName: parseDn(
              cert.subject as unknown as Record<string, string | string[]>,
              "CN",
            ),
            subjectAltNames: san,
            issuer,
            issuerOrg,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            serialNumber: cert.serialNumber,
            fingerprintSha256: cert.fingerprint256,
            protocol: socket.getProtocol() ?? undefined,
            authorizationError,
            chain,
            checkedAt: new Date().toISOString(),
          },
        });
      },
    );

    socket.on("timeout", () =>
      done({ ok: false, error: "El servidor tardó demasiado en responder.", kind: "timeout" }),
    );
    socket.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
        return done({ ok: false, error: "No se pudo resolver el dominio (DNS).", kind: "dns" });
      }
      done({
        ok: false,
        error: "No se pudo establecer una conexión TLS con el servidor (puerto 443).",
        kind: "connection",
      });
    });
  });
}
