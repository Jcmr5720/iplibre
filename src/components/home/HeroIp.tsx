"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, RefreshCw, Wifi } from "lucide-react";
import type { GeoInfo } from "@/lib/providers/types";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/CopyButton";

export function HeroIp() {
  const [data, setData] = React.useState<GeoInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const res = await apiGet<GeoInfo>("/api/ip");
    if (res.ok) setData(res.data);
    else setFailed(true);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tu IP pública
        </span>
        <button
          type="button"
          onClick={load}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Actualizar IP"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <Skeleton className="mt-2 h-9 w-48" />
      ) : failed ? (
        <p className="mt-2 text-lg font-semibold text-muted-foreground">No disponible</p>
      ) : (
        <div className="mt-1 flex items-center gap-3">
          <p className="font-mono text-2xl font-bold tracking-tight break-all sm:text-3xl">
            {data?.ip}
          </p>
          {data?.ip && <CopyButton value={data.ip} compact toastMessage="IP copiada" />}
        </div>
      )}

      {data && !loading && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {data.isp && (
            <span className="inline-flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" /> {data.isp}
            </span>
          )}
          {(data.city || data.country) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[data.city, data.country].filter(Boolean).join(", ")}
              <span className="opacity-70">(aprox.)</span>
            </span>
          )}
        </div>
      )}

      <Link
        href="/mi-ip"
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        Ver todos los datos →
      </Link>
    </div>
  );
}
