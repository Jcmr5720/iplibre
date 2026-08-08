"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatDateTime } from "@/lib/format";
import type { DnssecState } from "@/lib/net/dnssec";

interface DnskeyRecord {
  flags: number;
  algorithm: number;
  algorithmName: string;
  role: "KSK" | "ZSK" | "otro";
  publicKey: string;
}
interface DsRecord {
  keyTag: number;
  algorithmName: string;
  digestType: number;
  digestTypeName: string;
  digest: string;
}
interface Data {
  domain: string;
  classification: { state: DnssecState; label: string; detail: string };
  hasDnskey: boolean;
  hasDs: boolean;
  authenticated: boolean;
  bogus: boolean;
  soaStatus: string;
  dnskeys: DnskeyRecord[];
  ds: DsRecord[];
  checkedAt: string;
}

const TONE_BY_STATE: Record<DnssecState, BannerTone> = {
  "active-validated": "success",
  "signed-unvalidated": "warning",
  "validation-failure": "danger",
  absent: "neutral",
  unknown: "neutral",
};

export function DnssecChecker() {
  const { data, error, loading, run } = useApiQuery<Data>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dominio"
            placeholder="cloudflare.com"
            buttonLabel="Comprobar"
            loading={loading}
            autoFocus
            inputMode="url"
            examples={["cloudflare.com", "dnssec-failed.org", "google.com"]}
            onSubmit={(v) => run(`/api/dnssec?domain=${encodeURIComponent(v)}`)}
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
              Consultando DS, DNSKEY y validación…
            </p>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <ResultBanner
            tone={TONE_BY_STATE[data.classification.state]}
            icon={<ShieldCheck className="h-5 w-5" />}
            label={data.classification.label}
            detail={data.classification.detail}
            aside={
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Badge tone={data.hasDs ? "success" : "neutral"}>
                  {data.hasDs ? "DS presente" : "Sin DS"}
                </Badge>
                <Badge tone={data.hasDnskey ? "success" : "neutral"}>
                  {data.hasDnskey ? "DNSKEY presente" : "Sin DNSKEY"}
                </Badge>
              </div>
            }
          />

          <Card>
            <CardContent>
              <DataList
                rows={[
                  { label: "Dominio", value: data.domain, mono: true },
                  { label: "Delegación firmada (DS)", value: data.hasDs ? "Sí" : "No" },
                  { label: "Zona firmada (DNSKEY)", value: data.hasDnskey ? "Sí" : "No" },
                  {
                    label: "Respuesta autenticada (AD)",
                    value: data.authenticated ? "Sí" : "No",
                    hint: "resolutor validante",
                  },
                  { label: "Estado de la zona (SOA)", value: data.soaStatus, mono: true },
                  { label: "Comprobado", value: formatDateTime(data.checkedAt) },
                ]}
              />

              {(data.ds.length > 0 || data.dnskeys.length > 0) && (
                <details className="mt-4 rounded-md border border-border">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium marker:hidden">
                    Detalles técnicos · registros DS y DNSKEY
                  </summary>
                  <div className="space-y-4 px-3 pb-3">
                    {data.ds.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Registros DS ({data.ds.length})
                        </p>
                        <ul className="space-y-2">
                          {data.ds.map((d, i) => (
                            <li key={i} className="rounded-md border border-border p-2 text-xs">
                              <div className="flex flex-wrap gap-2">
                                <Badge tone="brand">Key tag {d.keyTag}</Badge>
                                <Badge tone="neutral">{d.algorithmName}</Badge>
                                <Badge tone="neutral">{d.digestTypeName}</Badge>
                              </div>
                              <div className="mt-1.5 flex items-start gap-2">
                                <code className="min-w-0 break-all font-mono text-muted-foreground">
                                  {d.digest}
                                </code>
                                <CopyButton value={d.digest} compact aria-label="Copiar digest DS" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.dnskeys.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Registros DNSKEY ({data.dnskeys.length})
                        </p>
                        <ul className="space-y-2">
                          {data.dnskeys.map((k, i) => (
                            <li key={i} className="rounded-md border border-border p-2 text-xs">
                              <div className="flex flex-wrap gap-2">
                                <Badge tone={k.role === "KSK" ? "brand" : "neutral"}>{k.role}</Badge>
                                <Badge tone="neutral">flags {k.flags}</Badge>
                                <Badge tone="neutral">{k.algorithmName}</Badge>
                              </div>
                              <div className="mt-1.5 flex items-start gap-2">
                                <code className="min-w-0 break-all font-mono text-muted-foreground">
                                  {k.publicKey.length > 64 ? `${k.publicKey.slice(0, 64)}…` : k.publicKey}
                                </code>
                                <CopyButton value={k.publicKey} compact aria-label="Copiar clave pública" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          <Alert tone="info">
            <strong className="text-foreground">Qué significa:</strong> DNSSEC añade autenticidad
            criptográfica a las respuestas DNS para detectar manipulaciones. Su{" "}
            <strong className="text-foreground">ausencia no implica</strong> que el sitio sea inseguro
            o malicioso: muchos dominios legítimos aún no lo han desplegado.
          </Alert>
        </div>
      )}
    </div>
  );
}
