"use client";

import * as React from "react";
import { Download, Search } from "lucide-react";
import type { DnsAnswer, DnsResult } from "@/lib/providers/types";
import { DNS_TYPES } from "@/lib/providers/dns";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Input, Label, Select, Skeleton, Spinner } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";

type SingleData = DnsResult & { domain: string; unicode: string };
type AllData = { domain: string; unicode: string; resolver: string; results: DnsResult[] };
type Data = SingleData | AllData;

function isAll(d: Data): d is AllData {
  return (d as AllData).results !== undefined;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(results: DnsResult[]): string {
  const rows = [["type", "name", "ttl", "data", "priority", "weight", "port"]];
  for (const r of results) {
    for (const a of r.answers) {
      rows.push([
        a.type,
        a.name,
        String(a.ttl),
        `"${a.data.replace(/"/g, '""')}"`,
        a.priority != null ? String(a.priority) : "",
        a.weight != null ? String(a.weight) : "",
        a.port != null ? String(a.port) : "",
      ]);
    }
  }
  return rows.map((r) => r.join(",")).join("\n");
}

export function DnsLookup() {
  const { data, error, loading, run } = useApiQuery<Data>();
  const [domain, setDomain] = React.useState("");
  const [type, setType] = React.useState<string>("A");
  const [all, setAll] = React.useState(false);
  const [technical, setTechnical] = React.useState(false);
  const domainId = React.useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    const params = new URLSearchParams({ domain: domain.trim() });
    if (all) params.set("all", "1");
    else params.set("type", type);
    run(`/api/dns?${params.toString()}`);
  }

  const results: DnsResult[] = data ? (isAll(data) ? data.results : [data]) : [];
  const withAnswers = results.filter((r) => r.answers.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div>
                <Label htmlFor={domainId}>Dominio</Label>
                <Input
                  id={domainId}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="ejemplo.com"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="font-mono"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="dns-type">Tipo</Label>
                <Select
                  id="dns-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={all}
                  className="sm:w-28"
                >
                  {DNS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading || !domain.trim()} className="w-full sm:w-auto">
                  {loading ? <Spinner /> : <Search className="h-4 w-4" />}
                  Consultar
                </Button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => setAll(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--primary)]"
              />
              Consultar todos los tipos de registro compatibles
            </label>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert tone="warning" title="No disponible" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <Card>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">
                  {isAll(data) ? "Todos los registros de " : "Resultado para "}
                  <span className="font-mono">{data.domain}</span>
                </h2>
                {data.unicode !== data.domain && (
                  <Badge tone="neutral">{data.unicode}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setTechnical((v) => !v)}>
                  {technical ? "Vista comprensible" : "Vista técnica"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => download(`dns-${data.domain}.json`, JSON.stringify(data, null, 2), "application/json")}
                >
                  <Download className="h-4 w-4" /> JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => download(`dns-${data.domain}.csv`, toCsv(results), "text/csv")}
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </div>

            {technical ? (
              <pre className="thin-scroll max-h-[28rem] overflow-auto rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : withAnswers.length === 0 ? (
              <Alert tone="info">
                No se encontraron registros{isAll(data) ? "" : ` de tipo ${(data as SingleData).type}`} para este
                dominio. Esto puede ser normal según su configuración.
              </Alert>
            ) : (
              <div className="space-y-5">
                {withAnswers.map((r) => (
                  <RecordGroup key={r.type} result={r} />
                ))}
                <p className="text-xs text-muted-foreground">
                  Resolutor: {results[0]?.resolver} · Estado: {results[0]?.status} · Tiempo de
                  respuesta: {results[0]?.responseMs} ms
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecordGroup({ result }: { result: DnsResult }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge tone="brand">{result.type}</Badge>
        <span className="text-xs text-muted-foreground">{result.answers.length} registro(s)</span>
      </div>
      <div className="thin-scroll overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Valor</th>
              <th className="px-3 py-2 font-medium">TTL</th>
              {result.type === "MX" && <th className="px-3 py-2 font-medium">Prioridad</th>}
              {result.type === "SRV" && <th className="px-3 py-2 font-medium">P/W/Puerto</th>}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {result.answers.map((a: DnsAnswer, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-mono break-all">{a.data}</td>
                <td className="px-3 py-2 text-muted-foreground">{a.ttl}s</td>
                {result.type === "MX" && <td className="px-3 py-2">{a.priority}</td>}
                {result.type === "SRV" && (
                  <td className="px-3 py-2">
                    {a.priority}/{a.weight}/{a.port}
                  </td>
                )}
                <td className="px-3 py-2 text-right">
                  <CopyButton value={a.data} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
