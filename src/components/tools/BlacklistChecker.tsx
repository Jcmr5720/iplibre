"use client";

import * as React from "react";
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { formatDateTime } from "@/lib/format";

type BlacklistState = "clean" | "listed" | "incomplete";
type Outcome = "listed" | "clean" | "error";

interface DnsblResult {
  zone: string;
  name: string;
  outcome: Outcome;
  responses: string[];
  detail?: string;
  info?: string;
}
interface Data {
  ip: string;
  state: BlacklistState;
  stateLabel: string;
  listedCount: number;
  cleanCount: number;
  errorCount: number;
  total: number;
  results: DnsblResult[];
  resolvedFrom?: string;
  checkedAt: string;
}

const STATE_TONE: Record<BlacklistState, BannerTone> = {
  clean: "success",
  listed: "danger",
  incomplete: "warning",
};

const OUTCOME_META: Record<Outcome, { icon: React.ReactNode; badge: "success" | "danger" | "warning"; label: string }> = {
  listed: { icon: <XCircle className="h-4 w-4 text-danger" aria-hidden />, badge: "danger", label: "Listada" },
  clean: { icon: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />, badge: "success", label: "Limpia" },
  error: { icon: <AlertCircle className="h-4 w-4 text-warning" aria-hidden />, badge: "warning", label: "Sin respuesta" },
};

export function BlacklistChecker() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dirección IPv4 o dominio"
            placeholder="8.8.8.8"
            buttonLabel="Comprobar"
            loading={loading}
            autoFocus
            inputMode="text"
            examples={["8.8.8.8", "1.1.1.1", "example.com"]}
            onSubmit={(v) => run(`/api/blacklist?query=${encodeURIComponent(v)}`)}
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
              Consultando listas de reputación…
            </p>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <ResultBanner
            tone={STATE_TONE[data.state]}
            icon={<ShieldAlert className="h-5 w-5" />}
            label={data.stateLabel}
            detail={
              data.resolvedFrom
                ? `IP analizada: ${data.ip} (resuelta desde ${data.resolvedFrom}).`
                : `IP analizada: ${data.ip}.`
            }
            aside={
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                <Badge tone="danger">{data.listedCount} listada{data.listedCount === 1 ? "" : "s"}</Badge>
                <Badge tone="success">{data.cleanCount} limpias</Badge>
                {data.errorCount > 0 && <Badge tone="warning">{data.errorCount} sin respuesta</Badge>}
              </div>
            }
          />

          {data.state === "listed" && (
            <Alert tone="warning">
              Esta IP aparece actualmente registrada en determinadas listas de reputación. Las listas
              externas pueden contener falsos positivos, retrasos o criterios diferentes:{" "}
              <strong className="text-foreground">aparecer en una lista no implica</strong> por sí solo
              que la IP sea maliciosa.
            </Alert>
          )}

          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {data.results.map((r) => {
                  const meta = OUTCOME_META[r.outcome];
                  return (
                    <li key={r.zone} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {meta.icon}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{r.zone}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <Badge tone={meta.badge}>{meta.label}</Badge>
                        {r.outcome === "listed" && r.responses.length > 0 && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {r.responses.join(", ")}
                          </span>
                        )}
                        {r.outcome === "error" && r.detail && (
                          <span className="max-w-[12rem] truncate text-xs text-muted-foreground" title={r.detail}>
                            {r.detail}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            {data.total} listas consultadas · {formatDateTime(data.checkedAt)}. Las listas que no
            responden se muestran aparte y no cuentan como «limpia».
          </p>
        </div>
      )}
    </div>
  );
}
