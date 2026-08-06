"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import type { RdapNormalized } from "@/lib/providers/rdap";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";

type Data = RdapNormalized & { kind: "domain" | "ip" | "asn"; input: string; unicode?: string };

const EVENT_LABELS: Record<string, string> = {
  registration: "Creación",
  "last changed": "Última actualización",
  "last update of RDAP database": "Actualización RDAP",
  expiration: "Vencimiento",
  "last renewed": "Última renovación",
  deletion: "Eliminación",
  transfer: "Transferencia",
};

function formatDate(d: string): string {
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleString("es-ES");
}

export function WhoisLookup() {
  const { data, error, loading, run, code } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dominio, IP o ASN"
            placeholder="ejemplo.com · 8.8.8.8 · AS15169"
            loading={loading}
            autoFocus
            examples={["google.com", "1.1.1.1", "AS13335"]}
            onSubmit={(v) => run(`/api/rdap?query=${encodeURIComponent(v)}`)}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert tone={code === "network" ? "danger" : "warning"} title="No disponible" role="alert">
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              {data.kind === "domain" ? "Dominio" : data.kind === "ip" ? "Red IP" : "ASN"}
            </Badge>
            <h2 className="font-mono text-lg font-semibold">{data.unicode || data.input}</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Datos del registro</h3>
                {data.kind === "domain" ? (
                  <DataList
                    rows={[
                      { label: "Nombre", value: data.name, mono: true },
                      { label: "Registrador", value: data.registrar },
                      { label: "Handle", value: data.handle, mono: true },
                      { label: "DNSSEC", value: data.dnssec == null ? undefined : data.dnssec ? "Firmado" : "No firmado" },
                    ]}
                  />
                ) : (
                  <DataList
                    rows={[
                      { label: "Nombre", value: data.name },
                      { label: "Handle", value: data.handle, mono: true },
                      { label: "Rango", value: data.startAddress ? `${data.startAddress} – ${data.endAddress}` : data.asnRange, mono: true },
                      { label: "CIDR", value: data.cidr?.join(", "), mono: true },
                      { label: "Versión IP", value: data.ipVersion },
                      { label: "Tipo", value: data.type },
                      { label: "País", value: data.country },
                    ]}
                  />
                )}
                <p className="mt-3 text-xs text-muted-foreground">Fuente: {data.source}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Eventos y estado</h3>
                {data.events.length > 0 ? (
                  <DataList
                    rows={data.events.map((e) => ({
                      label: EVENT_LABELS[e.action] || e.action,
                      value: formatDate(e.date),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin eventos publicados.</p>
                )}
                {data.status.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {data.status.map((s) => (
                      <Badge key={s} tone="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {data.nameservers && data.nameservers.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Servidores DNS</h3>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {data.nameservers.map((ns) => (
                    <li key={ns} className="font-mono text-sm">
                      {ns}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.entities.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Entidades y contactos públicos</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.entities.slice(0, 8).map((e, i) => (
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
                          { label: "Nombre", value: e.name },
                          { label: "Organización", value: e.organization },
                          { label: "Email", value: e.email },
                          { label: "Teléfono", value: e.phone },
                          { label: "Handle", value: e.handle, mono: true },
                        ]}
                      />
                    </div>
                  ))}
                </div>
                <Alert tone="info" className="mt-4">
                  Muchos contactos están protegidos por privacidad (RGPD/redacción). La ausencia de
                  datos no es un error del sistema.
                </Alert>
              </CardContent>
            </Card>
          )}

          {data.links.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold">Enlaces relacionados</h3>
                <ul className="space-y-1.5">
                  {data.links.slice(0, 8).map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 break-all text-sm text-primary hover:underline"
                      >
                        {l.href}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
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
