"use client";

import * as React from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";
import { CopyButton } from "@/components/ui/CopyButton";

interface ReverseData {
  mode: "reverse";
  ip: string;
  reverseName: string;
  resolver: string;
  responseMs: number;
  status: string;
  hostnames: string[];
  hasPtr: boolean;
  note?: string;
}
interface ForwardData {
  mode: "forward";
  domain: string;
  unicode: string;
  resolver: string;
  ipv4: string[];
  ipv6: string[];
  responseMs: number;
}
type Data = ReverseData | ForwardData;

export function ReverseDns() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="IP (PTR) o dominio (resolución directa)"
            placeholder="8.8.8.8 o ejemplo.com"
            loading={loading}
            autoFocus
            examples={["8.8.8.8", "1.1.1.1", "cloudflare.com"]}
            onSubmit={(v) => run(`/api/reverse-dns?query=${encodeURIComponent(v)}`)}
          />
        </CardContent>
      </Card>

      <Alert tone="info">
        <strong className="text-foreground">Resolución inversa (PTR):</strong> de una IP a un nombre
        de host. <strong className="text-foreground">Resolución directa:</strong> de un dominio a sus
        IP (A/AAAA). Introduce una IP o un dominio y detectamos cuál corresponde.
      </Alert>

      {error && (
        <Alert tone="warning" title="No disponible" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && data.mode === "reverse" && (
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <Badge tone="brand">PTR</Badge>
              <h2 className="font-mono text-lg font-semibold">{data.ip}</h2>
            </div>
            {data.hasPtr ? (
              <ul className="space-y-2">
                {data.hostnames.map((h) => (
                  <li key={h} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span className="font-mono text-sm break-all">{h}</span>
                    <CopyButton value={h} compact />
                  </li>
                ))}
              </ul>
            ) : (
              <Alert tone="info">{data.note}</Alert>
            )}
            <DataList
              className="mt-4"
              rows={[
                { label: "Nombre inverso", value: data.reverseName, mono: true },
                { label: "Resolutor", value: data.resolver },
                { label: "Estado", value: data.status },
                { label: "Tiempo de respuesta", value: `${data.responseMs} ms` },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {data && !loading && data.mode === "forward" && (
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <Badge tone="brand">A / AAAA</Badge>
              <h2 className="font-mono text-lg font-semibold">{data.domain}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <AddressList title="IPv4 (A)" items={data.ipv4} />
              <AddressList title="IPv6 (AAAA)" items={data.ipv6} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Resolutor: {data.resolver} · {data.responseMs} ms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddressList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registros.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((ip) => (
            <li key={ip} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
              <span className="font-mono text-sm break-all">{ip}</span>
              <CopyButton value={ip} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
