"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Play, Gauge } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { GeoInfo } from "@/lib/providers/types";
import { cloudflareProvider } from "@/lib/speed/cloudflare";
import { jitter as calcJitter, median } from "@/lib/stats";
import { formatMs } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";

type CheckState = "pending" | "running" | "ok" | "warn" | "fail";
interface CheckResult {
  id: string;
  label: string;
  state: CheckState;
  detail?: string;
}

const INITIAL: CheckResult[] = [
  { id: "online", label: "Estado del navegador", state: "pending" },
  { id: "https", label: "Acceso HTTPS al servicio", state: "pending" },
  { id: "ip", label: "IP pública (IPv4 / IPv6)", state: "pending" },
  { id: "dns", label: "Resolución DNS", state: "pending" },
  { id: "latency", label: "Latencia HTTP y jitter", state: "pending" },
];

export function Diagnostics() {
  const [checks, setChecks] = React.useState<CheckResult[]>(INITIAL);
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<string[]>([]);

  function update(id: string, patch: Partial<CheckResult>) {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  const run = React.useCallback(async () => {
    setRunning(true);
    setDone(false);
    setRecommendations([]);
    setChecks(INITIAL.map((c) => ({ ...c, state: "pending", detail: undefined })));
    const recs: string[] = [];
    const controller = new AbortController();

    // 1. Online
    update("online", { state: "running" });
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    update("online", {
      state: online ? "ok" : "fail",
      detail: online ? "El navegador informa conexión activa." : "El navegador informa que estás sin conexión.",
    });
    if (!online) recs.push("Tu navegador indica que no hay conexión. Revisa el Wi-Fi o el cable de red.");

    // 2. HTTPS / servicio
    update("https", { state: "running" });
    try {
      const t0 = performance.now();
      const res = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
      const ms = Math.round(performance.now() - t0);
      update("https", {
        state: res.ok ? "ok" : "warn",
        detail: res.ok ? `Servicio accesible (${ms} ms).` : `Respuesta inesperada (${res.status}).`,
      });
    } catch {
      update("https", { state: "fail", detail: "No se pudo contactar con el servicio por HTTPS." });
      recs.push("No hay acceso HTTPS al servicio. Puede ser un cortafuegos, un proxy o una caída temporal.");
    }

    // 3. IP pública
    update("ip", { state: "running" });
    const ipRes = await apiGet<GeoInfo>("/api/ip", controller.signal);
    if (ipRes.ok) {
      const v = ipRes.data.version;
      update("ip", {
        state: "ok",
        detail: `${ipRes.data.ip} (IPv${v ?? "?"})${ipRes.data.isp ? ` · ${ipRes.data.isp}` : ""}`,
      });
      if (v === 4) recs.push("Tu conexión se identifica con IPv4. IPv6 puede no estar activado en tu red.");
    } else {
      update("ip", { state: "warn", detail: ipRes.error });
    }

    // 4. DNS
    update("dns", { state: "running" });
    try {
      const t0 = performance.now();
      const dns = await apiGet<{ answers: unknown[] }>("/api/dns?domain=cloudflare.com&type=A", controller.signal);
      const ms = Math.round(performance.now() - t0);
      if (dns.ok && dns.data.answers.length > 0) {
        update("dns", { state: ms < 400 ? "ok" : "warn", detail: `Resolución correcta en ${ms} ms.` });
        if (ms >= 400) recs.push("La resolución DNS es algo lenta; considera usar un DNS público (1.1.1.1 o 8.8.8.8).");
      } else {
        update("dns", { state: "warn", detail: "No se obtuvieron respuestas DNS." });
      }
    } catch {
      update("dns", { state: "fail", detail: "Fallo en la resolución DNS." });
      recs.push("La resolución DNS falló. Prueba a cambiar tus servidores DNS.");
    }

    // 5. Latencia + jitter
    update("latency", { state: "running" });
    try {
      const samples = await cloudflareProvider.measureLatency(10, {
        signal: controller.signal,
        onProgress: () => {},
      });
      if (samples.length) {
        const lat = median(samples);
        const jit = calcJitter(samples);
        const state: CheckState = lat < 100 ? "ok" : lat < 200 ? "warn" : "fail";
        update("latency", {
          state,
          detail: `Latencia ${formatMs(lat)} · Jitter ${formatMs(jit)} (ida y vuelta HTTPS, no ICMP).`,
        });
        if (lat >= 100) recs.push("La latencia es elevada; en juegos o videollamadas podrías notar retardo.");
        if (jit >= 30) recs.push("El jitter es alto: la conexión es inestable, lo que afecta a llamadas y streaming.");
      } else {
        update("latency", { state: "warn", detail: "No se pudieron tomar muestras de latencia." });
      }
    } catch {
      update("latency", { state: "warn", detail: "No se pudo medir la latencia (posible bloqueador)." });
    }

    if (recs.length === 0) recs.push("Todo se ve correcto. Tu conexión responde bien en las comprobaciones básicas.");
    setRecommendations(recs);
    setRunning(false);
    setDone(true);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="max-w-xl text-sm text-muted-foreground">
            Ejecuta una batería de comprobaciones del estado de tu conexión. Diferenciamos entre
            estado local del navegador, acceso HTTPS, resolución DNS y latencia de aplicación. No se
            usa ICMP porque el navegador no lo permite.
          </p>
          <Button size="lg" onClick={run} disabled={running}>
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {running ? "Ejecutando…" : done ? "Repetir diagnóstico" : "Iniciar diagnóstico"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ul className="divide-y divide-border">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <StateIcon state={c.state} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.label}</p>
                  {c.detail && <p className="text-sm text-muted-foreground break-words">{c.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Alert tone="info" title="Recomendaciones">
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div>
            <p className="text-sm font-semibold">¿Quieres medir la velocidad real?</p>
            <p className="text-sm text-muted-foreground">
              El diagnóstico no mide el ancho de banda. Usa la prueba de velocidad completa.
            </p>
          </div>
          <ButtonLink href="/test-de-velocidad" variant="outline">
            <Gauge className="h-4 w-4" /> Ir al test de velocidad
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}

function StateIcon({ state }: { state: CheckState }) {
  if (state === "ok") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />;
  if (state === "warn") return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />;
  if (state === "fail") return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />;
  if (state === "running") return <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />;
  return <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-border" />;
}
