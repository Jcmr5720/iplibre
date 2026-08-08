"use client";

import * as React from "react";
import { CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
import { DNS_TYPES } from "@/lib/providers/dns";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Input, Label, Select, Skeleton, Spinner } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";

interface ResolverResult {
  resolverId: string;
  resolver: string;
  location: string;
  status: string;
  responseMs: number;
  values: string[];
}
interface PropData {
  domain: string;
  unicode: string;
  type: string;
  resolvers: ResolverResult[];
  summary: {
    total: number;
    answered: number;
    distinctAnswers: number;
    agreementPct: number;
    consistent: boolean;
  };
}

export function DnsPropagation() {
  const { data, error, loading, run } = useApiQuery<PropData>();
  const [domain, setDomain] = React.useState("");
  const [type, setType] = React.useState("A");
  const id = React.useId();

  const query = React.useCallback(
    (d: string, t: string) => {
      run(`/api/propagation?domain=${encodeURIComponent(d)}&type=${t}`);
    },
    [run],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (domain.trim()) query(domain.trim(), type);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <Label htmlFor={id}>Dominio</Label>
              <Input
                id={id}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ejemplo.com"
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="prop-type">Tipo</Label>
              <Select id="prop-type" value={type} onChange={(e) => setType(e.target.value)} className="sm:w-28">
                {DNS_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading || !domain.trim()} className="w-full sm:w-auto">
                {loading ? <Spinner /> : <Search className="h-4 w-4" />}
                Comparar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Alert tone="info">
        Se compara la respuesta entre <strong className="text-foreground">resolutores públicos</strong>{" "}
        (Cloudflare, Google, Quad9), redes anycast globales. No es una observación física desde
        países distintos: una discrepancia indica propagación incompleta o respuestas dependientes de
        la red, no “visto desde el país X”.
      </Alert>

      {error && (
        <Alert tone="warning" title="No disponible" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge tone={data.summary.consistent ? "success" : "warning"}>
                {data.summary.agreementPct}% de coincidencia
              </Badge>
              <span className="text-sm text-muted-foreground">
                {data.summary.answered}/{data.summary.total} resolutores respondieron ·{" "}
                {data.summary.distinctAnswers} respuesta(s) distinta(s)
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => query(data.domain, data.type)}>
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.resolvers.map((r) => {
              const ok = r.status !== "ERROR" && r.values.length > 0;
              return (
                <Card key={r.resolverId}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.resolver}</span>
                      {ok ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">{r.location}</p>
                    {ok ? (
                      <ul className="space-y-1">
                        {r.values.map((v, i) => (
                          <li key={i} className="truncate font-mono text-xs" title={v}>
                            {v}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin respuesta ({r.status})</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">{r.responseMs} ms</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
