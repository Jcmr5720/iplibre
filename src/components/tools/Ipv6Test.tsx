"use client";

import * as React from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { runIpv6Test, type Ipv6TestResult, type Ipv6Compat } from "@/lib/net/ipv6-client";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, Spinner } from "@/components/ui/primitives";
import { Alert } from "@/components/ui/Alert";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { DataList } from "@/components/tools/DataList";
import { cn } from "@/lib/utils";

const compatCopy: Record<Ipv6Compat, { tone: BannerTone; label: string; detail: string }> = {
  excellent: {
    tone: "success",
    label: "Compatibilidad IPv6: excelente",
    detail: "Tu conexión puede usar IPv4 e IPv6 correctamente.",
  },
  "ipv6-only": {
    tone: "warning",
    label: "Solo IPv6",
    detail: "Tu conexión usa IPv6 pero no se detectó conectividad IPv4.",
  },
  "ipv4-only": {
    tone: "warning",
    label: "Solo IPv4",
    detail: "Tu conexión utiliza actualmente IPv4. No se detectó conectividad IPv6.",
  },
  "ipv6-issues": {
    tone: "warning",
    label: "IPv6 con problemas",
    detail: "IPv6 está disponible pero presenta problemas de conectividad.",
  },
  unknown: {
    tone: "neutral",
    label: "No se pudo determinar",
    detail: "No se pudo comprobar la conectividad. Revisa tu conexión e inténtalo de nuevo.",
  },
};

function FamilyCard({
  title,
  reachable,
  ip,
  ms,
}: {
  title: string;
  reachable: boolean;
  ip?: string;
  ms?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            reachable ? "text-success" : "text-danger",
          )}
        >
          {reachable ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {reachable ? "Disponible" : "No disponible"}
        </span>
      </div>
      {reachable && (
        <div className="mt-2 space-y-1">
          {ip && <p className="break-all font-mono text-sm text-foreground">{ip}</p>}
          {ms != null && <p className="text-xs text-muted-foreground">Respuesta: {ms} ms</p>}
        </div>
      )}
    </div>
  );
}

export function Ipv6Test() {
  const [result, setResult] = React.useState<Ipv6TestResult | null>(null);
  const [serverIp, setServerIp] = React.useState<{ ip?: string; version?: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState("");

  const run = React.useCallback(async () => {
    setLoading(true);
    setResult(null);
    setPhase("Comprobando conectividad IPv4 e IPv6…");
    const [test, ipRes] = await Promise.all([
      runIpv6Test(),
      apiGet<{ ip?: string; version?: number }>("/api/ip"),
    ]);
    setResult(test);
    if (ipRes.ok) setServerIp({ ip: ipRes.data.ip, version: ipRes.data.version });
    setLoading(false);
    setPhase("");
  }, []);

  React.useEffect(() => {
    run();
  }, [run]);

  const compat = result ? compatCopy[result.compat] : null;

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              {phase || "Comprobando IPv6…"}
            </p>
          </CardContent>
        </Card>
      )}

      {compat && !loading && (
        <>
          <ResultBanner
            tone={compat.tone}
            label={compat.label}
            detail={compat.detail}
            aside={
              <Badge tone={result!.compat === "excellent" ? "success" : "warning"}>
                {result!.ipv6.reachable ? "IPv6 activo" : "Sin IPv6"}
              </Badge>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FamilyCard
              title="IPv4"
              reachable={result!.ipv4.reachable}
              ip={result!.ipv4.ip}
              ms={result!.ipv4.ms}
            />
            <FamilyCard
              title="IPv6"
              reachable={result!.ipv6.reachable}
              ip={result!.ipv6.ip}
              ms={result!.ipv6.ms}
            />
          </div>

          <Card>
            <CardContent>
              <DataList
                rows={[
                  {
                    label: "Conectividad IPv4",
                    value: result!.ipv4.reachable ? "Funciona" : "No detectada",
                  },
                  {
                    label: "Conectividad IPv6",
                    value: result!.ipv6.reachable ? "Funciona" : "No detectada",
                  },
                  {
                    label: "Tiempo de respuesta IPv4",
                    value: result!.ipv4.ms != null ? `${result!.ipv4.ms} ms` : undefined,
                  },
                  {
                    label: "Tiempo de respuesta IPv6",
                    value: result!.ipv6.ms != null ? `${result!.ipv6.ms} ms` : undefined,
                  },
                  {
                    label: "Llegaste a IPLibre con",
                    value: serverIp?.ip
                      ? `IPv${serverIp.version ?? "?"} · ${serverIp.ip}`
                      : undefined,
                    mono: true,
                  },
                ]}
              />
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={run} disabled={loading}>
                  <RefreshCw className="h-4 w-4" /> Repetir test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert tone="info">
            <strong className="text-foreground">Qué significa:</strong> IPv6 es la nueva generación
            de direcciones de Internet. Si solo tienes IPv4, la mayoría de sitios siguen funcionando
            gracias a mecanismos de compatibilidad, pero IPv6 mejora el rendimiento y evita la
            escasez de direcciones. La compatibilidad depende de tu proveedor y tu router.
          </Alert>
        </>
      )}
    </div>
  );
}
