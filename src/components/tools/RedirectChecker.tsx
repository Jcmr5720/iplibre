"use client";

import * as React from "react";
import { ArrowDown, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { cn } from "@/lib/utils";

interface Hop {
  index: number;
  url: string;
  method: "HEAD" | "GET";
  status: number;
  statusText: string;
  statusClass: string;
  redirectKind?: string;
  redirectLabel?: string;
  resolvedLocation?: string;
  https: boolean;
  responseMs: number;
}
interface Data {
  input: string;
  initialUrl: string;
  finalUrl: string;
  finalStatus: number;
  finalStatusText: string;
  hops: Hop[];
  redirectCount: number;
  totalMs: number;
  loopDetected: boolean;
  tooMany: boolean;
  startedHttp: boolean;
  endedHttps: boolean;
  upgradedToHttps: boolean;
  downgradedToHttp: boolean;
  checkedAt: string;
}

const STATUS_BADGE: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  redirect: "info",
  clientError: "warning",
  serverError: "danger",
  unknown: "neutral",
};

export function RedirectChecker() {
  const { data, error, loading, run } = useApiQuery<Data>();

  const bannerTone: BannerTone = data
    ? data.loopDetected || data.tooMany || data.downgradedToHttp
      ? "warning"
      : data.finalStatus >= 400
        ? "danger"
        : "success"
    : "neutral";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="URL o dominio"
            placeholder="http://example.com"
            buttonLabel="Seguir redirecciones"
            loading={loading}
            autoFocus
            inputMode="url"
            examples={["http://google.com", "http://github.com", "bit.ly"]}
            onSubmit={(v) => run(`/api/redirect?url=${encodeURIComponent(v)}`)}
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
              Siguiendo la cadena de redirecciones…
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <ResultBanner
            tone={bannerTone}
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={
              data.redirectCount === 0
                ? "Sin redirecciones"
                : `${data.redirectCount} redirección${data.redirectCount === 1 ? "" : "es"} hasta el destino`
            }
            detail={`Destino final: ${data.finalStatus} ${data.finalStatusText} · ${data.totalMs} ms en total.`}
            aside={
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {data.upgradedToHttps && <Badge tone="success">HTTP → HTTPS</Badge>}
                {data.endedHttps ? (
                  <Badge tone="success">Destino HTTPS</Badge>
                ) : (
                  <Badge tone="warning">Destino sin HTTPS</Badge>
                )}
              </div>
            }
          />

          {data.loopDetected && (
            <Alert tone="warning" title="Bucle detectado" role="alert">
              La cadena vuelve a una URL ya visitada: hay un bucle de redirección.
            </Alert>
          )}
          {data.tooMany && (
            <Alert tone="warning" title="Demasiadas redirecciones" role="alert">
              Se alcanzó el número máximo de saltos permitidos sin llegar a un destino final.
            </Alert>
          )}
          {data.downgradedToHttp && (
            <Alert tone="warning" title="Degradación a HTTP" role="alert">
              La cadena pasa de HTTPS a HTTP, lo que expone la conexión. Conviene revisarlo.
            </Alert>
          )}

          {/* Cadena visual */}
          <ol className="space-y-0">
            {data.hops.map((hop, i) => {
              const last = i === data.hops.length - 1;
              return (
                <li key={i}>
                  <Card>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {hop.https ? (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-success" aria-label="HTTPS" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="HTTP" />
                              )}
                              <code className="min-w-0 break-all font-mono text-xs text-foreground">
                                {hop.url}
                              </code>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge tone={STATUS_BADGE[hop.statusClass] ?? "neutral"}>
                                {hop.status} {hop.statusText}
                              </Badge>
                              {hop.redirectLabel && <Badge tone="neutral">{hop.redirectLabel}</Badge>}
                              <span className="text-xs text-muted-foreground">
                                {hop.method} · {hop.responseMs} ms
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {!last && (
                    <div className="flex justify-center py-1" aria-hidden>
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <Card>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Saltos</p>
                <p className="font-semibold text-foreground">{data.redirectCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiempo total</p>
                <p className="font-semibold text-foreground">{data.totalMs} ms</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">URL final</p>
                <div className="flex items-center gap-1.5">
                  {data.endedHttps ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                  )}
                  <code className="min-w-0 break-all font-mono text-xs text-foreground">
                    {data.finalUrl}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert tone="info">
            Seguimos la cadena manualmente y revalidamos la seguridad en cada salto. No se leen ni se
            muestran los contenidos de las páginas: solo el estado, el tipo de redirección y los
            tiempos.
          </Alert>
        </div>
      )}
    </div>
  );
}
