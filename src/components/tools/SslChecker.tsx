"use client";

import * as React from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatDateTime } from "@/lib/format";

interface ChainCert {
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
}
interface OkData {
  found: true;
  host: string;
  state: string;
  stateLabel: string;
  valid: boolean;
  hostnameValid: boolean;
  expired: boolean;
  notYetValid: boolean;
  daysRemaining: number;
  subjectCommonName?: string;
  subjectAltNames: string[];
  issuer?: string;
  validFrom: string;
  validTo: string;
  serialNumber?: string;
  fingerprintSha256?: string;
  protocol?: string;
  chain: ChainCert[];
  checkedAt: string;
}
interface FailData {
  found: false;
  host: string;
  stateLabel: string;
  stateDetail: string;
  errorKind: string;
}
type Data = OkData | FailData;

const toneFor: Record<string, BannerTone> = {
  secure: "success",
  expiringSoon: "warning",
  critical: "danger",
  expired: "danger",
  invalid: "danger",
  notYetValid: "warning",
};

export function SslChecker() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dominio"
            placeholder="iplibre.online"
            buttonLabel="Analizar"
            loading={loading}
            autoFocus
            inputMode="url"
            examples={["iplibre.online", "google.com", "expired.badssl.com"]}
            onSubmit={(v) => run(`/api/ssl?host=${encodeURIComponent(v)}`)}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert tone="warning" title="No se pudo analizar" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Comprobando certificado TLS…
            </p>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && !data.found && (
        <ResultBanner tone="danger" label={data.stateLabel} detail={data.stateDetail} />
      )}

      {data && !loading && data.found && (
        <div className="space-y-4">
          <ResultBanner
            tone={toneFor[data.state] ?? "neutral"}
            label={data.stateLabel}
            detail={
              data.expired
                ? "El certificado ha caducado."
                : data.notYetValid
                  ? "El certificado aún no es válido."
                  : `Vence en ${data.daysRemaining} día${data.daysRemaining === 1 ? "" : "s"}.`
            }
            aside={
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Badge tone={data.valid ? "success" : "danger"}>
                  {data.valid ? "Cadena válida" : "Cadena no confiable"}
                </Badge>
                <Badge tone={data.hostnameValid ? "success" : "danger"}>
                  {data.hostnameValid ? "Dominio coincide" : "Dominio no coincide"}
                </Badge>
              </div>
            }
          />

          <Alert tone="info">
            <strong className="text-foreground">Qué significa:</strong> este certificado permite que
            la conexión entre tu navegador y el sitio esté cifrada. Un certificado válido protege la
            conexión, pero <strong className="text-foreground">no garantiza</strong> que el contenido
            o el propietario del sitio sean de confianza.
          </Alert>

          <Card>
            <CardContent>
              <DataList
                rows={[
                  { label: "Dominio consultado", value: data.host, mono: true },
                  { label: "Nombre común (CN)", value: data.subjectCommonName, mono: true },
                  { label: "Emisor", value: data.issuer },
                  { label: "Válido desde", value: formatDateTime(data.validFrom) },
                  { label: "Válido hasta", value: formatDateTime(data.validTo) },
                  { label: "Días restantes", value: String(data.daysRemaining) },
                  { label: "Protocolo TLS", value: data.protocol },
                  {
                    label: "Número de serie",
                    value: data.serialNumber,
                    copyValue: data.serialNumber,
                    mono: true,
                  },
                ]}
              />

              {data.subjectAltNames.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Nombres alternativos (SAN)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.subjectAltNames.map((san) => (
                      <span
                        key={san}
                        className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs break-all"
                      >
                        {san}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4 rounded-md border border-border">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium marker:hidden">
                  Detalles técnicos · huella y cadena de certificados
                </summary>
                <div className="space-y-3 px-3 pb-3">
                  {data.fingerprintSha256 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fingerprint SHA-256</p>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 break-all font-mono text-xs">
                          {data.fingerprintSha256}
                        </code>
                        <CopyButton value={data.fingerprintSha256} compact />
                      </div>
                    </div>
                  )}
                  {data.chain.length > 0 && (
                    <ol className="space-y-2">
                      {data.chain.map((c, i) => (
                        <li key={i} className="rounded-md border border-border p-2 text-xs">
                          <p className="font-medium text-foreground">
                            {i === 0 ? "Certificado del sitio" : `Intermedio ${i}`}
                          </p>
                          <p className="text-muted-foreground break-all">CN: {c.subject ?? "—"}</p>
                          <p className="text-muted-foreground break-all">Emisor: {c.issuer ?? "—"}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
