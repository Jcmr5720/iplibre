"use client";

import * as React from "react";
import { Lock, RefreshCw, Share2 } from "lucide-react";
import type { GeoInfo } from "@/lib/providers/types";
import { apiGet } from "@/lib/api-client";
import { getClientInfo, type ClientInfo } from "@/lib/client-info";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { Alert } from "@/components/ui/Alert";
import { CopyButton } from "@/components/ui/CopyButton";
import { DataList } from "@/components/tools/DataList";
import { MiniMap } from "@/components/tools/MiniMap";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils";

type IpData = GeoInfo & { partial?: boolean; note?: string; detectedFrom?: string };

function privacyStatus(data: IpData): { label: string; detail: string; tone: "success" | "warning" | "neutral" } {
  if (data.isVpn || data.isProxy || data.isHosting) {
    return {
      label: data.isVpn ? "VPN detectada" : data.isProxy ? "Proxy detectado" : "Red de hosting",
    detail: "La fuente de datos marca esta IP como intermediaria. Verifica WebRTC si buscas privacidad.",
      tone: "warning",
    };
  }
  return {
    label: "IP pública visible",
    detail: "Los sitios pueden ver esta IP. No detectamos señales públicas de VPN o proxy en esta fuente.",
    tone: "neutral",
  };
}

export function MyIp() {
  const [data, setData] = React.useState<IpData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [client, setClient] = React.useState<ClientInfo | null>(null);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiGet<IpData>("/api/ip");
    if (res.ok) setData(res.data);
    else setError(res.error);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
    setClient(getClientInfo());
    const onStatus = () => setClient(getClientInfo());
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, [load]);

  function buildSummary(): string {
    if (!data) return "";
    const lines = [
      `IP: ${data.ip}`,
      data.isp && `Proveedor: ${data.isp}`,
      data.asn && `ASN: AS${data.asn}`,
      data.city && `Ciudad: ${data.city}`,
      data.region && `Región: ${data.region}`,
      data.country && `País: ${data.country}`,
      data.timezone && `Zona horaria: ${data.timezone}`,
    ].filter(Boolean);
    return lines.join("\n");
  }

  async function share() {
    const text = buildSummary();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mi IP — IPLibre", text });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    const ok = await copyToClipboard(text);
    toast(ok ? "Resumen copiado al portapapeles" : "No se pudo compartir", ok ? "success" : "danger");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <Card className="overflow-hidden">
          <div className="brand-gradient-bg px-4 py-5 text-primary-foreground sm:px-6">
            <p className="text-sm font-medium opacity-90">Tu dirección IP pública</p>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-64 bg-white/20" />
            ) : error ? (
              <p className="mt-2 text-2xl font-bold">No disponible</p>
            ) : (
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <p className="max-w-full font-mono text-[clamp(1.55rem,8vw,2.4rem)] font-bold tracking-tight break-all leading-tight sm:text-4xl">
                  {data?.ip}
                </p>
                <Badge tone="neutral" className="w-fit bg-white/20 text-white">
                  IPv{data?.version ?? "?"}
                </Badge>
              </div>
            )}
            {!loading && !error && data && (
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton
                  value={data.ip}
                  label="Copiar IP"
                  copiedLabel="Copiada"
                  toastMessage="IP copiada"
                  className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                />
                <CopyButton
                  value={buildSummary()}
                  label="Copiar todo"
                  copiedLabel="Copiado"
                  className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                />
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/25"
                >
                  <Share2 className="h-3.5 w-3.5" /> Compartir
                </button>
                <button
                  type="button"
                  onClick={load}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/25"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Actualizar
                </button>
              </div>
            )}
          </div>

          <CardContent>
            {error ? (
              <Alert tone="warning" title="No pudimos completar la consulta">
                {error}
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={load}>
                    <RefreshCw className="h-4 w-4" /> Reintentar
                  </Button>
                </div>
              </Alert>
            ) : loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : data ? (
              <>
                {data.partial && (
                  <Alert tone="info" className="mb-4">
                    {data.note}
                  </Alert>
                )}
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="mt-1 font-semibold">IPv{data.version ?? "?"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Ubicación aprox.</p>
                    <p className="mt-1 truncate font-semibold">
                      {[data.city, data.country].filter(Boolean).join(", ") || "No disponible"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Privacidad</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-primary" />
                      <Badge tone={privacyStatus(data).tone}>{privacyStatus(data).label}</Badge>
                    </div>
                  </div>
                </div>
                <DataList
                  rows={[
                    { label: "Proveedor (ISP)", value: data.isp },
                    { label: "Organización", value: data.org },
                    { label: "ASN", value: data.asn ? `AS${data.asn}` : undefined, copyValue: data.asn ? `AS${data.asn}` : undefined, mono: true },
                    { label: "País", value: data.country ? `${data.flagEmoji ?? ""} ${data.country}`.trim() : undefined },
                    { label: "Código de país", value: data.countryCode },
                    { label: "Región", value: data.region },
                    { label: "Ciudad (aprox.)", value: data.city },
                    { label: "Código postal", value: data.postal },
                    { label: "Zona horaria", value: data.timezone },
                    { label: "Coordenadas (aprox.)", value: data.latitude != null && data.longitude != null ? `${data.latitude}, ${data.longitude}` : undefined, mono: true },
                    { label: "Fuente de datos", value: data.source },
                  ]}
                />
                <Alert tone="info" className="mt-4">
                  <strong className="text-foreground">Estado básico de privacidad:</strong>{" "}
                  {privacyStatus(data).detail}
                </Alert>
              </>
            ) : null}
          </CardContent>
        </Card>

        {!loading && !error && data && (
          <Alert tone="info" className="mt-4">
            <strong className="text-foreground">La ubicación es aproximada.</strong> Se estima a
            partir de la dirección IP y puede no coincidir con tu domicilio real: a menudo refleja la
            sede del proveedor o el nodo de red. No debe usarse para identificar a una persona.
          </Alert>
        )}
      </div>

      <div className="min-w-0 space-y-5 lg:col-span-5">
        {loading ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <Skeleton className="aspect-[2/1] w-full rounded-none" />
            <div className="border-t border-border bg-card px-3 py-2">
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ) : !error && data?.latitude != null && data?.longitude != null ? (
          <MiniMap lat={data.latitude} lng={data.longitude} label={data.city} />
        ) : null}

        <Card>
          <CardContent>
            <h2 className="mb-3 text-sm font-semibold">Tu navegador y dispositivo</h2>
            {client ? (
              <DataList
                rows={[
                  { label: "Navegador", value: client.browser },
                  { label: "Sistema operativo", value: client.os },
                  { label: "Tipo de dispositivo", value: client.deviceType },
                  { label: "Idioma", value: client.language },
                  { label: "Núcleos de CPU", value: client.cores ? String(client.cores) : undefined },
                  { label: "Pantalla táctil", value: client.touch ? "Sí" : "No" },
                  { label: "Tipo de conexión", value: client.connectionType },
                  {
                    label: "Estado (navegador)",
                    value: (
                      <Badge tone={client.online ? "success" : "danger"}>
                        {client.online ? "En línea" : "Sin conexión"}
                      </Badge>
                    ),
                  },
                ]}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
            {client && (
              <div className="mt-3">
                <CopyButton value={client.userAgent} label="Copiar user agent" compact={false} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
