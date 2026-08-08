"use client";

import * as React from "react";
import type { GeoInfo } from "@/lib/providers/types";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/primitives";
import { SearchForm } from "@/components/tools/SearchForm";
import { DataList } from "@/components/tools/DataList";
import { MiniMap } from "@/components/tools/MiniMap";

export function GeoLookup() {
  const { data, error, loading, run } = useApiQuery<GeoInfo>();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchForm
            label="Dirección IP a geolocalizar"
            placeholder="8.8.8.8 o 2001:4860:4860::8888"
            buttonLabel="Geolocalizar"
            loading={loading}
            autoFocus
            examples={["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"]}
            onSubmit={(v) => run(`/api/geo?ip=${encodeURIComponent(v)}`)}
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
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent>
              <h2 className="mb-3 text-sm font-semibold">
                Resultado para <span className="font-mono break-all">{data.ip}</span>
              </h2>
              <DataList
                rows={[
                  { label: "Versión", value: data.version ? `IPv${data.version}` : undefined },
                  { label: "País", value: data.country ? `${data.flagEmoji ?? ""} ${data.country}`.trim() : undefined },
                  { label: "Código de país", value: data.countryCode },
                  { label: "Región", value: data.region },
                  { label: "Ciudad (aprox.)", value: data.city },
                  { label: "Código postal", value: data.postal },
                  { label: "Zona horaria", value: data.timezone },
                  { label: "Latitud", value: data.latitude != null ? String(data.latitude) : undefined, mono: true },
                  { label: "Longitud", value: data.longitude != null ? String(data.longitude) : undefined, mono: true },
                  { label: "Proveedor (ISP)", value: data.isp },
                  { label: "Organización", value: data.org },
                  { label: "ASN", value: data.asn ? `AS${data.asn}` : undefined, mono: true },
                  { label: "Fuente", value: data.source },
                  { label: "Consultado", value: data.fetchedAt ? new Date(data.fetchedAt).toLocaleString("es-ES") : undefined },
                ]}
              />
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {data.latitude != null && data.longitude != null && (
              <MiniMap lat={data.latitude} lng={data.longitude} label={data.city} />
            )}
            <Alert tone="info">
              La ubicación es <strong className="text-foreground">aproximada</strong> y procede de
              bases de datos de geolocalización IP. Puede corresponder al nodo del proveedor y no a
              una vivienda o persona concreta.
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}
