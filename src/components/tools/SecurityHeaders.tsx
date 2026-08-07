"use client";

import * as React from "react";
import { Check, Minus, X } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { cn } from "@/lib/utils";

interface HeaderCheck {
  key: string;
  name: string;
  present: boolean;
  value?: string;
  status: "ok" | "partial" | "missing" | "info";
  importance: "alta" | "media" | "baja";
  weight: number;
  earned: number;
  description: string;
  recommendation: string;
}
interface CspFinding {
  severity: "error" | "warning" | "note";
  message: string;
}
interface OkData {
  reachable: true;
  input: string;
  finalUrl: string;
  status: number;
  score: number;
  maxScore: number;
  rating: string;
  checks: HeaderCheck[];
  informational: { name: string; value: string; note: string }[];
  csp: { present: boolean; findings: CspFinding[] };
  hsts: { present: boolean; maxAge?: number; includeSubDomains: boolean; preload: boolean; notes: string[] };
}
interface FailData {
  reachable: false;
  input: string;
  stateDetail: string;
  errorKind: string;
}
type Data = OkData | FailData;

const ratingTone: Record<string, BannerTone> = {
  Excelente: "success",
  Buena: "success",
  Mejorable: "warning",
  Débil: "danger",
};

const statusIcon = {
  ok: <Check className="h-4 w-4 text-success" aria-label="Configurado" />,
  partial: <Minus className="h-4 w-4 text-warning" aria-label="Parcial" />,
  missing: <X className="h-4 w-4 text-danger" aria-label="Ausente" />,
  info: <Minus className="h-4 w-4 text-muted-foreground" aria-label="Informativo" />,
};

export function SecurityHeaders() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dominio o URL"
            placeholder="https://ejemplo.com"
            buttonLabel="Analizar"
            loading={loading}
            autoFocus
            inputMode="url"
            examples={["iplibre.online", "github.com", "mozilla.org"]}
            onSubmit={(v) => run(`/api/security-headers?url=${encodeURIComponent(v)}`)}
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
              Analizando headers de seguridad…
            </p>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && !data.reachable && (
        <ResultBanner tone="danger" label="No accesible" detail={data.stateDetail} />
      )}

      {data && !loading && data.reachable && (
        <div className="space-y-4">
          <ResultBanner
            tone={ratingTone[data.rating] ?? "neutral"}
            label={`Puntuación: ${data.score}/${data.maxScore} · ${data.rating}`}
            detail={`Analizado: ${data.finalUrl} (HTTP ${data.status})`}
            aside={
              <p className="font-mono text-3xl font-bold text-foreground">{data.score}</p>
            }
          />

          <Alert tone="info">
            Esta evaluación analiza únicamente determinados encabezados HTTP y{" "}
            <strong className="text-foreground">no constituye una auditoría completa de seguridad</strong>.
            La puntuación es orientativa y transparente: cada cabecera aporta un peso fijo.
          </Alert>

          <Card>
            <CardContent className="space-y-3">
              {data.checks.map((c) => (
                <div key={c.key} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {statusIcon[c.status]}
                      <span className="font-mono text-sm font-medium break-all">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          c.importance === "alta" ? "danger" : c.importance === "media" ? "warning" : "neutral"
                        }
                      >
                        {c.importance}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {c.earned}/{c.weight}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
                  {c.value && (
                    <p className="mt-1 break-all font-mono text-xs text-foreground/70">{c.value}</p>
                  )}
                  {c.status !== "ok" && (
                    <p className="mt-1 text-xs text-primary">Recomendación: {c.recommendation}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {(data.csp.present || data.hsts.present) && (
            <Card>
              <CardContent className="space-y-4">
                {data.csp.present && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Análisis de la CSP</h3>
                    <ul className="space-y-1">
                      {data.csp.findings.map((f, i) => (
                        <li
                          key={i}
                          className={cn(
                            "text-sm",
                            f.severity === "error"
                              ? "text-danger"
                              : f.severity === "warning"
                                ? "text-warning"
                                : "text-muted-foreground",
                          )}
                        >
                          {f.severity === "error"
                            ? "⛔ "
                            : f.severity === "warning"
                              ? "⚠️ "
                              : "• "}
                          {f.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.hsts.present && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Análisis de HSTS</h3>
                    <p className="text-sm text-muted-foreground">
                      max-age: {data.hsts.maxAge ?? "—"} · includeSubDomains:{" "}
                      {data.hsts.includeSubDomains ? "sí" : "no"} · preload:{" "}
                      {data.hsts.preload ? "sí" : "no"}
                    </p>
                    {data.hsts.notes.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {data.hsts.notes.map((n, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {n}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {data.informational.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="mb-2 text-sm font-semibold">Información expuesta</h3>
                <ul className="space-y-2">
                  {data.informational.map((info) => (
                    <li key={info.name} className="text-sm">
                      <span className="font-mono font-medium">{info.name}:</span>{" "}
                      <span className="break-all font-mono text-muted-foreground">{info.value}</span>
                      <p className="text-xs text-warning">{info.note}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
