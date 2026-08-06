"use client";

import * as React from "react";
import type { AsnInfo, IpToAsn } from "@/lib/providers/asninfo";
import type { RdapNormalized } from "@/lib/providers/rdap";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";

interface Data {
  via: "asn" | "ip";
  mapping?: IpToAsn;
  info: AsnInfo;
  rdap: RdapNormalized | null;
}

export function AsnLookup() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Número ASN o dirección IP"
            placeholder="AS15169 o 8.8.8.8"
            loading={loading}
            autoFocus
            examples={["AS15169", "AS13335", "8.8.8.8"]}
            onSubmit={(v) => run(`/api/asn?query=${encodeURIComponent(v)}`)}
          />
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
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {data.via === "ip" && data.mapping && (
            <Alert tone="info">
              La IP <span className="font-mono">{data.mapping.ip}</span> pertenece al prefijo{" "}
              <span className="font-mono">{data.mapping.prefix}</span>, anunciado por{" "}
              <strong className="text-foreground">AS{data.mapping.asn}</strong>.
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">AS{data.info.asn}</Badge>
            <h2 className="text-lg font-semibold">{data.info.name || data.info.description}</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Información del ASN</h3>
                <DataList
                  rows={[
                    { label: "Número", value: `AS${data.info.asn}`, mono: true, copyValue: `AS${data.info.asn}` },
                    { label: "Nombre", value: data.info.name },
                    { label: "Descripción", value: data.info.description },
                    { label: "País", value: data.info.country },
                    { label: "Registro regional (RIR)", value: data.info.rir },
                    {
                      label: "Sitio web",
                      value: data.info.website ? (
                        <a href={data.info.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {data.info.website}
                        </a>
                      ) : undefined,
                    },
                    { label: "Prefijos IPv4", value: String(data.info.ipv4Prefixes.length) },
                    { label: "Prefijos IPv6", value: String(data.info.ipv6Prefixes.length) },
                    { label: "Fuente", value: data.info.source },
                  ]}
                />
              </CardContent>
            </Card>

            {data.rdap && data.rdap.entities.length > 0 && (
              <Card>
                <CardContent>
                  <h3 className="mb-3 text-sm font-semibold">Contactos públicos (RDAP)</h3>
                  <div className="space-y-3">
                    {data.rdap.entities.slice(0, 4).map((e, i) => (
                      <div key={i} className="rounded-md border border-border p-3">
                        <div className="mb-2 flex flex-wrap gap-1">
                          {e.roles.map((r) => (
                            <Badge key={r} tone="info">
                              {r}
                            </Badge>
                          ))}
                        </div>
                        <DataList
                          rows={[
                            { label: "Nombre", value: e.name || e.organization },
                            { label: "Email", value: e.email },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <PrefixTable title="Prefijos IPv4 anunciados" prefixes={data.info.ipv4Prefixes} />
          <PrefixTable title="Prefijos IPv6 anunciados" prefixes={data.info.ipv6Prefixes} />
        </div>
      )}
    </div>
  );
}

function PrefixTable({
  title,
  prefixes,
}: {
  title: string;
  prefixes: { prefix: string; name?: string; country?: string }[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  if (prefixes.length === 0) return null;
  const shown = expanded ? prefixes : prefixes.slice(0, 12);
  return (
    <Card>
      <CardContent>
        <h3 className="mb-3 text-sm font-semibold">
          {title} <span className="text-muted-foreground">({prefixes.length})</span>
        </h3>
        <div className="thin-scroll max-h-96 overflow-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted/80 text-xs uppercase text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 font-medium">Prefijo</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">País</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.prefix} className="border-t border-border/60">
                  <td className="px-3 py-1.5 font-mono">{p.prefix}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{p.name || "—"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{p.country || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prefixes.length > 12 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {expanded ? "Mostrar menos" : `Ver los ${prefixes.length}`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
