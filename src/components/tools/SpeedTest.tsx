"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gauge as GaugeIcon,
  Play,
  RotateCcw,
  Share2,
  Trash2,
  X,
  FileText,
  ImageDown,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { GeoInfo } from "@/lib/providers/types";
import { useSpeedTest } from "@/lib/speed/useSpeedTest";
import { getProvider } from "@/lib/speed/engine";
import { formatBitrate, formatDateTime, formatMbps, formatMs, toMbps } from "@/lib/format";
import { overallQuality, useCaseRatings } from "@/lib/speed/rating";
import { maskIp } from "@/lib/privacy";
import { copyToClipboard } from "@/lib/utils";
import { exportPdf, exportPng } from "@/lib/speed/report";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";

const PHASES = [
  { key: "latency", label: "Latencia", Icon: GaugeIcon },
  { key: "download", label: "Descarga", Icon: ArrowDownToLine },
  { key: "upload", label: "Subida", Icon: ArrowUpFromLine },
] as const;

export function SpeedTest() {
  const [meta, setMeta] = React.useState<{ ip?: string; isp?: string }>({});
  const { status, progress, result, error, history, start, cancel, reset, clear } = useSpeedTest(
    meta.isp,
  );
  const { toast } = useToast();
  const provider = getProvider("cloudflare");

  React.useEffect(() => {
    apiGet<GeoInfo>("/api/ip").then((res) => {
      if (res.ok) setMeta({ ip: res.data.ip, isp: res.data.isp });
    });
  }, []);

  const running = status === "running";
  const instant =
    progress.instantBps != null ? formatBitrate(progress.instantBps) : { value: "0.0", unit: "Mbps" };
  const dialValue =
    progress.phase === "download" || progress.phase === "upload"
      ? Math.min(1, toMbps(progress.instantBps ?? 0) / 200)
      : progress.fraction;

  const testId = React.useMemo(() => history[0]?.id, [history]);

  function summaryText(): string {
    if (!result) return "";
    return [
      "Resultado IPLibre",
      `Descarga: ${formatMbps(result.downloadBps)}`,
      `Subida: ${formatMbps(result.uploadBps)}`,
      `Latencia: ${formatMs(result.latencyMs)} · Jitter: ${formatMs(result.jitterMs)}`,
      meta.isp && `Proveedor: ${meta.isp}`,
      meta.ip && `IP: ${maskIp(meta.ip)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function share() {
    const text = summaryText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mi velocidad — IPLibre", text });
        return;
      } catch {
        /* cancelado */
      }
    }
    const ok = await copyToClipboard(text);
    toast(ok ? "Resumen copiado" : "No se pudo compartir", ok ? "success" : "danger");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <Dial fraction={dialValue} phase={progress.phase} running={running}>
            {status === "idle" ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Listo para medir</p>
                <p className="mt-1 text-2xl font-bold">Pulsa iniciar</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">
                  {running || status === "done"
                    ? status === "done" && result
                      ? formatMbps(result.downloadBps).replace(" Mbps", "")
                      : instant.value
                    : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status === "done" ? "Mbps (descarga)" : `${instant.unit} · ${phaseLabel(progress.phase)}`}
                </p>
              </div>
            )}
          </Dial>

          {/* Fases */}
          <div className="flex w-full max-w-md items-center justify-between gap-2">
            {PHASES.map(({ key, label, Icon }) => {
              const active = progress.phase === key;
              const done = phaseDone(progress.phase, key, status);
              return (
                <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "brand-gradient-bg border-transparent text-primary-foreground"
                        : done
                          ? "border-success/40 bg-success-bg text-success"
                          : "border-border text-muted-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={active ? "text-xs font-semibold text-foreground" : "text-xs text-muted-foreground"}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === "idle" || status === "cancelled" ? (
              <Button size="lg" onClick={start}>
                <Play className="h-5 w-5" /> Iniciar prueba
              </Button>
            ) : running ? (
              <Button size="lg" variant="danger" onClick={cancel}>
                <X className="h-5 w-5" /> Cancelar
              </Button>
            ) : (
              <Button size="lg" onClick={start}>
                <RotateCcw className="h-5 w-5" /> Repetir prueba
              </Button>
            )}
            {(status === "done" || status === "error") && (
              <Button size="lg" variant="outline" onClick={reset}>
                Reiniciar
              </Button>
            )}
          </div>

          <p className="max-w-lg text-center text-xs text-muted-foreground">
            Proveedor de medición: <strong className="text-foreground">{provider.name}</strong>. La
            latencia es el tiempo de ida y vuelta HTTPS, no un ping ICMP. El volumen de datos se
            adapta a tu velocidad para no consumir de más.
          </p>
        </CardContent>
      </Card>

      {status === "cancelled" && (
        <Alert tone="info" title="Prueba cancelada">
          Has detenido la medición. Puedes iniciarla de nuevo cuando quieras.
        </Alert>
      )}
      {status === "error" && error && (
        <Alert tone="danger" title="No se pudo completar la prueba">
          {error}
        </Alert>
      )}

      {status === "done" && result && (
        <ResultPanel
          result={result}
          meta={meta}
          onShare={share}
          onPng={() => exportPng(result, { ...meta, testId: testId ?? "—" }).catch(() => toast("No se pudo exportar la imagen", "danger"))}
          onPdf={() => exportPdf(result, { ...meta, testId: testId ?? "—" }).catch(() => toast("No se pudo exportar el PDF", "danger"))}
          onCopy={async () => {
            const ok = await copyToClipboard(summaryText());
            toast(ok ? "Resumen copiado" : "No se pudo copiar", ok ? "success" : "danger");
          }}
          testId={testId}
        />
      )}

      {history.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Historial (guardado solo en este navegador)</h2>
              <Button size="sm" variant="ghost" onClick={clear}>
                <Trash2 className="h-4 w-4" /> Borrar historial
              </Button>
            </div>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Descarga</th>
                    <th className="py-2 pr-4 font-medium">Subida</th>
                    <th className="py-2 pr-4 font-medium">Latencia</th>
                    <th className="py-2 pr-4 font-medium">Jitter</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-muted-foreground">{formatDateTime(h.startedAt)}</td>
                      <td className="py-2 pr-4 font-medium">{formatMbps(h.downloadBps)}</td>
                      <td className="py-2 pr-4">{formatMbps(h.uploadBps)}</td>
                      <td className="py-2 pr-4">{formatMs(h.latencyMs)}</td>
                      <td className="py-2 pr-4">{formatMs(h.jitterMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function phaseLabel(phase: string): string {
  return phase === "latency" ? "latencia" : phase === "download" ? "descarga" : phase === "upload" ? "subida" : phase;
}

function phaseDone(current: string, key: string, status: string): boolean {
  const order = ["latency", "download", "upload"];
  if (status === "done") return true;
  return order.indexOf(current) > order.indexOf(key);
}

function Dial({
  fraction,
  phase,
  running,
  children,
}: {
  fraction: number;
  phase: string;
  running: boolean;
  children: React.ReactNode;
}) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={phase === "upload" ? "var(--brand-2)" : "var(--brand-1)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped)}
          style={{ transition: running ? "stroke-dashoffset 0.25s ease" : "none" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        {children}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  meta,
  onShare,
  onPng,
  onPdf,
  onCopy,
  testId,
}: {
  result: import("@/lib/speed/types").SpeedResult;
  meta: { ip?: string; isp?: string };
  onShare: () => void;
  onPng: () => void;
  onPdf: () => void;
  onCopy: () => void;
  testId?: string;
}) {
  const quality = overallQuality(result.downloadBps, result.latencyMs);
  const cases = useCaseRatings(result.downloadBps, result.uploadBps, result.latencyMs);

  const metrics = [
    { label: "Descarga", value: formatMbps(result.downloadBps), Icon: ArrowDownToLine },
    { label: "Subida", value: formatMbps(result.uploadBps), Icon: ArrowUpFromLine },
    { label: "Latencia (reposo)", value: formatMs(result.latencyMs), Icon: GaugeIcon },
    { label: "Jitter", value: formatMs(result.jitterMs), Icon: GaugeIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Resultado</h2>
          <Badge tone={quality.tone}>Calidad: {quality.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <FileText className="h-4 w-4" /> Copiar resumen
          </Button>
          <Button size="sm" variant="outline" onClick={onPng}>
            <ImageDown className="h-4 w-4" /> Imagen
          </Button>
          <Button size="sm" variant="outline" onClick={onPdf}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={onShare}>
            <Share2 className="h-4 w-4" /> Compartir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <m.Icon className="h-4 w-4" />
                <span className="text-xs">{m.label}</span>
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h3 className="mb-3 text-sm font-semibold">Detalles de la medición</h3>
            <dl className="divide-y divide-border text-sm">
              {[
                ["Latencia bajo descarga", formatMs(result.latencyLoadedDownloadMs)],
                ["Latencia bajo subida", formatMs(result.latencyLoadedUploadMs)],
                ["Estabilidad", result.stability],
                ["Datos descargados", `${(result.bytesDownloaded / 1024 / 1024).toFixed(1)} MB`],
                ["Datos subidos", `${(result.bytesUploaded / 1024 / 1024).toFixed(1)} MB`],
                ["Duración", `${(result.durationMs / 1000).toFixed(1)} s`],
                ["Proveedor de medición", result.provider],
                ["Tipo de conexión (navegador)", result.connectionType ?? "No informado"],
                ["Proveedor de Internet", meta.isp ?? "—"],
                ["IP (protegida)", meta.ip ? maskIp(meta.ip) : "—"],
                ["ID de prueba", testId ?? "—"],
                ["Fecha y hora", formatDateTime(result.startedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="mb-1 text-sm font-semibold">Calidad estimada por uso</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Clasificación orientativa según tu resultado. No es una garantía.
            </p>
            <ul className="space-y-2">
              {cases.map((c) => (
                <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-block h-2.5 w-2.5 rounded-full",
                        c.ok ? "bg-success" : "bg-warning",
                      ].join(" ")}
                      aria-hidden
                    />
                    {c.label}
                  </span>
                  <span className={c.ok ? "text-success" : "text-warning"}>{c.detail}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Alert tone="info">
        Estos valores son orientativos y pueden variar según la hora, el servidor de destino, tu red
        local (Wi-Fi frente a cable) y otros dispositivos conectados. No sustituyen una medición
        certificada de tu proveedor.
      </Alert>
    </div>
  );
}
