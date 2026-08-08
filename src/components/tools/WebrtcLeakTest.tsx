"use client";

import * as React from "react";
import { ShieldCheck, Play, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { DataList } from "@/components/tools/DataList";
import {
  analyzeCandidates,
  candidateTypeLabel,
  parseCandidate,
  type ParsedCandidate,
  type WebrtcAnalysis,
  type WebrtcState,
} from "@/lib/net/webrtc";

/**
 * Servidores STUN públicos usados solo para descubrir la IP reflejada (srflx),
 * igual que hace cualquier videollamada. Son de terceros: descubrir la IP
 * pública implica, por diseño, contactar con ellos.
 */
const STUN_SERVERS = [
  "stun:stun.cloudflare.com:3478",
  "stun:stun.l.google.com:19302",
];

const TONE_BY_STATE: Record<WebrtcState, BannerTone> = {
  noLeak: "success",
  possibleLeak: "warning",
  restricted: "neutral",
  unknown: "neutral",
};

interface ServerIpState {
  ip: string | null;
  loading: boolean;
}

function collectCandidates(timeoutMs = 6000): Promise<{ raw: string[]; supported: boolean }> {
  return new Promise((resolve) => {
    const RTC =
      typeof window !== "undefined"
        ? window.RTCPeerConnection ||
          // @ts-expect-error prefijos heredados
          window.webkitRTCPeerConnection ||
          // @ts-expect-error prefijos heredados
          window.mozRTCPeerConnection
        : undefined;
    if (!RTC) {
      resolve({ raw: [], supported: false });
      return;
    }

    const raw = new Set<string>();
    let pc: RTCPeerConnection | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try {
        pc?.close();
      } catch {
        /* noop */
      }
      resolve({ raw: Array.from(raw), supported: true });
    };

    const timer = setTimeout(finish, timeoutMs);

    try {
      pc = new RTC({ iceServers: [{ urls: STUN_SERVERS }] });
      // Un canal de datos fuerza la recolección de candidatos ICE.
      pc.createDataChannel("iplibre");
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          // Gathering completo.
          clearTimeout(timer);
          finish();
          return;
        }
        if (e.candidate.candidate) raw.add(e.candidate.candidate);
      };
      pc.onicegatheringstatechange = () => {
        if (pc && pc.iceGatheringState === "complete") {
          clearTimeout(timer);
          finish();
        }
      };
      pc.createOffer()
        .then((offer) => {
          // Extrae también los candidatos incrustados en el SDP como respaldo.
          (offer.sdp || "")
            .split(/\r?\n/)
            .filter((l) => l.includes("candidate:"))
            .forEach((l) => raw.add(l));
          return pc!.setLocalDescription(offer);
        })
        .catch(() => {
          clearTimeout(timer);
          finish();
        });
    } catch {
      clearTimeout(timer);
      resolve({ raw: [], supported: false });
    }
  });
}

export function WebrtcLeakTest() {
  const [server, setServer] = React.useState<ServerIpState>({ ip: null, loading: true });
  const [running, setRunning] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const [analysis, setAnalysis] = React.useState<WebrtcAnalysis | null>(null);

  // Obtiene la IP pública que ve el servidor (para comparar), sin almacenarla.
  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ip", { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => {
        const ip = j?.ok && typeof j.data?.ip === "string" ? j.data.ip : null;
        setServer({ ip, loading: false });
      })
      .catch(() => setServer({ ip: null, loading: false }));
    return () => controller.abort();
  }, []);

  const run = React.useCallback(async () => {
    setRunning(true);
    setAnalysis(null);
    const { raw, supported: sup } = await collectCandidates();
    setSupported(sup);
    if (!sup) {
      setRunning(false);
      return;
    }
    const parsed = raw
      .map(parseCandidate)
      .filter((c): c is ParsedCandidate => c !== null);
    setAnalysis(analyzeCandidates(parsed, server.ip));
    setRunning(false);
  }, [server.ip]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La prueba se ejecuta <strong className="text-foreground">en tu navegador</strong>: crea una
            conexión WebRTC y observa qué direcciones IP revela a través de los candidatos ICE. No se
            envían tus candidatos ni tus IP a IPLibre.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={run} disabled={running} size="lg" className="sm:w-auto">
              {running ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : analysis ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {running ? "Analizando…" : analysis ? "Repetir prueba" : "Iniciar prueba WebRTC"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {server.loading
                ? "Detectando tu IP pública…"
                : server.ip
                  ? `IP pública detectada por IPLibre: ${server.ip}`
                  : "No se pudo detectar tu IP pública (comparación limitada)."}
            </span>
          </div>
        </CardContent>
      </Card>

      {!supported && (
        <Alert tone="warning" title="WebRTC no disponible" role="alert">
          Tu navegador no expone la API WebRTC (RTCPeerConnection), o está bloqueada por una extensión
          de privacidad. En ese caso, tu navegador no filtra IP por esta vía.
        </Alert>
      )}

      {running && (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Recopilando candidatos ICE…
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {analysis && !running && (
        <div className="space-y-4">
          <ResultBanner
            tone={TONE_BY_STATE[analysis.state]}
            icon={<ShieldCheck className="h-5 w-5" />}
            label={analysis.stateLabel}
            detail={analysis.summary}
          />

          <Card>
            <CardContent>
              <DataList
                rows={[
                  {
                    label: "IP pública (servidor)",
                    value: server.ip ?? "No detectada",
                    mono: true,
                    copyValue: server.ip ?? undefined,
                  },
                  {
                    label: "IP públicas vía WebRTC",
                    value:
                      analysis.publicIps.length > 0 ? analysis.publicIps.join(", ") : "Ninguna",
                    mono: analysis.publicIps.length > 0,
                  },
                  {
                    label: "IP locales reveladas",
                    value:
                      analysis.privateIps.length > 0 ? analysis.privateIps.join(", ") : "Ninguna",
                    mono: analysis.privateIps.length > 0,
                  },
                  {
                    label: "Candidatos ocultos con mDNS",
                    value: String(analysis.mdnsCount),
                    hint: "IP local protegida",
                  },
                  { label: "Candidatos totales", value: String(analysis.candidates.length) },
                ]}
              />

              {analysis.candidates.length > 0 && (
                <details className="mt-4 rounded-md border border-border">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium marker:hidden">
                    Detalles técnicos · candidatos ICE observados
                  </summary>
                  <div className="overflow-x-auto px-3 pb-3">
                    <table className="w-full min-w-[32rem] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">Tipo</th>
                          <th className="py-2 pr-3 font-medium">Dirección</th>
                          <th className="py-2 pr-3 font-medium">Proto</th>
                          <th className="py-2 font-medium">Clasificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.candidates.map((c, i) => (
                          <tr key={i} className="border-b border-border/60 last:border-0">
                            <td className="py-2 pr-3">{candidateTypeLabel(c.type)}</td>
                            <td className="py-2 pr-3 font-mono break-all">{c.address}</td>
                            <td className="py-2 pr-3 uppercase">{c.protocol}</td>
                            <td className="py-2">
                              {c.isMdns ? (
                                <Badge tone="info">mDNS</Badge>
                              ) : c.isPublic ? (
                                <Badge tone="warning">Pública {c.ipVersion === 6 ? "IPv6" : "IPv4"}</Badge>
                              ) : c.isPrivate ? (
                                <Badge tone="danger">Privada</Badge>
                              ) : (
                                <Badge tone="neutral">—</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          <Alert tone="info">
            <strong className="text-foreground">Cómo interpretarlo:</strong> revelar la misma IP
            pública que el sitio ya ve no es una fuga adicional. Esta prueba{" "}
            <strong className="text-foreground">no detecta todas las fugas posibles</strong> de una
            VPN, y los navegadores con mDNS (Chrome, Firefox) ocultan las IP locales de forma
            legítima. Un resultado «restringido» es una buena señal de privacidad.
          </Alert>
        </div>
      )}
    </div>
  );
}
