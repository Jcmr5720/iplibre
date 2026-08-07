"use client";

import * as React from "react";
import { RefreshCw, Share2 } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

interface RedirectHop {
  from: string;
  to: string;
  status: number;
}
interface OkData {
  reachable: true;
  input: string;
  finalUrl: string;
  protocol: string;
  httpsAvailable: boolean;
  status: number;
  statusText: string;
  state: "up" | "warning" | "down";
  stateLabel: string;
  stateDetail: string;
  responseMs: number;
  redirected: boolean;
  redirectCount: number;
  redirectChain: RedirectHop[];
  server?: string;
  contentType?: string;
  contentLength?: number;
  ipAddresses: string[];
  checkedAt: string;
}
interface DownData {
  reachable: false;
  input: string;
  state: "down";
  stateLabel: string;
  stateDetail: string;
  errorKind: string;
  checkedAt: string;
}
type Data = OkData | DownData;

const toneFor: Record<string, BannerTone> = {
  up: "success",
  warning: "warning",
  down: "danger",
};

export function WebsiteStatus() {
  const { data, error, loading, run } = useApiQuery<Data>();
  const [lastQuery, setLastQuery] = React.useState("");
  const { toast } = useToast();

  const check = (v: string) => {
    setLastQuery(v);
    run(`/api/site-status?url=${encodeURIComponent(v)}`);
  };

  function buildSummary(): string {
    if (!data) return "";
    const lines: string[] = [`Comprobación de estado — IPLibre`, `Entrada: ${data.input}`];
    if (data.reachable) {
      lines.push(
        `URL final: ${data.finalUrl}`,
        `Estado: ${data.status} ${data.statusText} (${data.stateLabel})`,
        `Tiempo de respuesta: ${data.responseMs} ms`,
        `Redirecciones: ${data.redirectCount}`,
        data.server ? `Servidor: ${data.server}` : "",
      );
    } else {
      lines.push(`Resultado: no accesible — ${data.stateDetail}`);
    }
    return lines.filter(Boolean).join("\n");
  }

  async function share() {
    const text = buildSummary();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Estado web — IPLibre", text });
        return;
      } catch {
        /* cancelado */
      }
    }
    const ok = await copyToClipboard(text);
    toast(ok ? "Resumen copiado" : "No se pudo compartir", ok ? "success" : "danger");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dominio o URL"
            placeholder="google.com o https://google.com"
            buttonLabel="Comprobar"
            loading={loading}
            autoFocus
            inputMode="url"
            examples={["iplibre.online", "google.com", "github.com"]}
            onSubmit={check}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert tone="warning" title="No se pudo comprobar" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Resolviendo dominio y conectando…
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <ResultBanner
            tone={toneFor[data.state] ?? "neutral"}
            label={data.stateLabel}
            detail={data.stateDetail}
            aside={
              data.reachable ? (
                <div>
                  <p className="font-mono text-2xl font-bold text-foreground">{data.status}</p>
                  <p className="text-xs text-muted-foreground">{data.statusText}</p>
                </div>
              ) : undefined
            }
          />

          {data.reachable && (
            <Card>
              <CardContent>
                <DataList
                  rows={[
                    { label: "URL final", value: data.finalUrl, copyValue: data.finalUrl, mono: true },
                    { label: "Protocolo", value: data.protocol.toUpperCase() },
                    { label: "HTTPS disponible", value: data.httpsAvailable ? "Sí" : "No" },
                    { label: "Código HTTP", value: `${data.status} · ${data.statusText}`, mono: true },
                    { label: "Tiempo de respuesta", value: `${data.responseMs} ms` },
                    { label: "Redirecciones", value: String(data.redirectCount) },
                    { label: "Servidor", value: data.server, mono: true },
                    { label: "Tipo de contenido", value: data.contentType, mono: true },
                    {
                      label: "Tamaño declarado",
                      value:
                        data.contentLength != null ? formatBytes(data.contentLength) : undefined,
                    },
                  ]}
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton value={buildSummary()} label="Copiar resultado" toastMessage="Resultado copiado" />
                  <button
                    type="button"
                    onClick={share}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Compartir
                  </button>
                  <button
                    type="button"
                    onClick={() => check(lastQuery)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Comprobar de nuevo
                  </button>
                </div>

                {data.redirectChain.length > 0 && (
                  <details className="mt-4 rounded-md border border-border">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium marker:hidden">
                      Detalles técnicos · cadena de redirecciones ({data.redirectCount}) y DNS
                    </summary>
                    <div className="space-y-2 px-3 pb-3">
                      <ol className="space-y-1 text-xs">
                        {data.redirectChain.map((hop, i) => (
                          <li key={i} className="break-all font-mono text-muted-foreground">
                            {hop.status} → {hop.to}
                          </li>
                        ))}
                      </ol>
                      {data.ipAddresses.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          IPs resueltas:{" "}
                          <span className="break-all font-mono">{data.ipAddresses.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {!data.reachable && (
            <Alert tone="info">
              El servidor no respondió. Esto puede deberse a que el dominio no existe, hay un
              problema de DNS/TLS, o el sitio está caído. No confundir con un error HTTP (403/404),
              en el que el servidor sí responde.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
