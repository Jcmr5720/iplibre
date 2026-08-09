"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, FileSearch, FileUp, RotateCcw, ShieldCheck, Square, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { ANALYSIS_TIMEOUT_MS, MAX_FILE_BYTES } from "@/lib/file-analysis/constants";
import type { AnalysisResult, WorkerResponse } from "@/lib/file-analysis/types";
import { cn } from "@/lib/utils";

type Status = "empty" | "selected" | "working" | "complete" | "cancelled" | "error";

const severityLabels = { informativa: "Informativa", baja: "Baja", media: "Media", alta: "Alta", critica: "Critica" } as const;
const severityClasses = {
  informativa: "border-border bg-muted text-foreground",
  baja: "border-success/30 bg-success-bg text-success-foreground",
  media: "border-warning/40 bg-warning-bg text-warning-foreground",
  alta: "border-danger/35 bg-danger-bg text-danger-foreground",
  critica: "border-danger/60 bg-danger text-white",
} as const;

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`;
  return `${(size / 1024 / 1024).toFixed(1)} MiB`;
}

function recommendation(result: AnalysisResult): string {
  if (result.score < 20) return "No encontramos indicadores evidentes, pero este analisis no garantiza que el archivo sea seguro.";
  if (result.score < 40) return "Verifica el origen del archivo antes de abrirlo y presta atencion a los indicadores encontrados.";
  return "Evita ejecutar o abrir este archivo hasta analizarlo con una solucion antivirus completa.";
}

export function VirusAnalyzer() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<Status>("empty");
  const [dragging, setDragging] = React.useState(false);
  const [phase, setPhase] = React.useState("Listo para analizar");
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState("");

  const stopWorker = React.useCallback(() => {
    workerRef.current?.terminate(); workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  React.useEffect(() => stopWorker, [stopWorker]);

  const chooseFile = React.useCallback((next: File | undefined) => {
    stopWorker(); setResult(null); setError("");
    if (!next) return;
    setFile(next);
    if (next.size > MAX_FILE_BYTES) {
      setStatus("error");
      setError("Este archivo supera el tamaño admitido para analisis local en este dispositivo.");
    } else {
      setStatus("selected"); setPhase("Listo para analizar");
    }
  }, [stopWorker]);

  const startAnalysis = React.useCallback(() => {
    if (!file || file.size > MAX_FILE_BYTES) return;
    stopWorker(); setStatus("working"); setError(""); setResult(null); setPhase("Preparando archivo");
    const worker = new Worker(new URL("../../workers/file-analysis.worker.ts", import.meta.url), { type: "module", name: "iplibre-file-analysis" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === "progress") setPhase(message.label);
      if (message.type === "result") { setResult(message.result); setStatus("complete"); setPhase("Analisis finalizado"); stopWorker(); }
      if (message.type === "error") { setError(message.message); setStatus("error"); stopWorker(); }
    };
    worker.onerror = () => { setError("No pudimos analizar este archivo. Intentalo de nuevo."); setStatus("error"); stopWorker(); };
    timeoutRef.current = setTimeout(() => { stopWorker(); setStatus("error"); setError("El analisis supero el tiempo seguro y fue detenido."); }, ANALYSIS_TIMEOUT_MS);
    worker.postMessage({ type: "analyze", file });
  }, [file, stopWorker]);

  const cancel = React.useCallback(() => { stopWorker(); setStatus("cancelled"); setPhase("Analisis cancelado"); }, [stopWorker]);
  const reset = React.useCallback(() => { stopWorker(); setFile(null); setResult(null); setError(""); setStatus("empty"); if (inputRef.current) inputRef.current.value = ""; }, [stopWorker]);

  return (
    <section aria-labelledby="analyzer-title" className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden /><h2 id="analyzer-title" className="text-xl font-bold">Analizador local de archivos</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Tu archivo no se sube a IPLibre ni se envia a terceros.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Analisis local</span>
      </div>

      <div className="p-4 sm:p-6">
        {status === "empty" ? (
          <div
            className={cn("flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors", dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30")}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}
          >
            <FileUp className="h-11 w-11 text-primary" aria-hidden />
            <p className="mt-4 text-lg font-semibold">Arrastra un archivo aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">o elige uno desde tu dispositivo (maximo 64 MiB)</p>
            <Button className="mt-5 min-w-48" size="lg" onClick={() => inputRef.current?.click()}><FileSearch className="h-5 w-5" aria-hidden /> Seleccionar archivo</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="break-all font-semibold" title={file?.name}>{file?.name}</p><p className="mt-1 text-sm text-muted-foreground">{file ? formatBytes(file.size) : ""} · .{file?.name.split(".").pop()?.toLowerCase() || "sin extension"} · {file?.type || "tipo no declarado"}</p></div>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={status === "working"}>Cambiar archivo</Button>
            </div>

            {status === "selected" && <Button size="lg" className="w-full sm:w-auto" onClick={startAnalysis}><FileSearch className="h-5 w-5" aria-hidden /> Analizar archivo</Button>}
            {status === "working" && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-5" aria-live="polite" aria-busy="true">
                <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{phase}</p><p className="mt-1 text-sm text-muted-foreground">El procesamiento ocurre fuera del hilo principal.</p></div><Button variant="outline" size="sm" onClick={cancel}><Square className="h-3.5 w-3.5" aria-hidden /> Cancelar</Button></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={phase}><div className="h-full w-1/2 animate-pulse rounded-full bg-primary" /></div>
              </div>
            )}
            {status === "cancelled" && <div role="status" className="rounded-xl border border-warning/40 bg-warning-bg p-4"><p className="font-semibold">Analisis cancelado</p><p className="mt-1 text-sm">El archivo se descarto del proceso. Puedes analizarlo nuevamente.</p><Button className="mt-3" size="sm" onClick={startAnalysis}><RotateCcw className="h-4 w-4" aria-hidden /> Analizar nuevamente</Button></div>}
            {status === "error" && <div role="alert" className="rounded-xl border border-danger/35 bg-danger-bg p-4"><div className="flex gap-2"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden /><div><p className="font-semibold">No pudimos analizar este archivo</p><p className="mt-1 text-sm">{error}</p></div></div>{file && file.size <= MAX_FILE_BYTES && <Button className="mt-3" size="sm" variant="outline" onClick={startAnalysis}>Intentar de nuevo</Button>}</div>}
            {status === "complete" && result ? <AnalysisResults result={result} onAgain={startAnalysis} /> : null}
          </div>
        )}
        <input ref={inputRef} type="file" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} aria-label="Seleccionar archivo para analizar" />
        {status !== "empty" && status !== "working" ? <button type="button" onClick={reset} className="mt-5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Quitar archivo y empezar de nuevo</button> : null}
      </div>
    </section>
  );
}

function AnalysisResults({ result, onAgain }: { result: AnalysisResult; onAgain: () => void }) {
  const risky = result.score >= 40;
  return (
    <div className="space-y-6" data-testid="analysis-result">
      <div className={cn("grid gap-5 rounded-xl border p-5 md:grid-cols-[180px_1fr] md:items-center", risky ? "border-danger/30 bg-danger-bg/40" : result.score >= 20 ? "border-warning/35 bg-warning-bg/40" : "border-success/30 bg-success-bg/40")}>
        <div className="flex items-center gap-4 md:flex-col md:text-center"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-current bg-card text-2xl font-bold" aria-label={`Puntuacion ${result.score} de 100`}>{result.score}</div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nivel de riesgo</p><p className="mt-1 text-lg font-bold">{result.riskLevel}</p></div></div>
        <div><h3 className="text-lg font-semibold">Resultado general</h3><p className="mt-2 text-sm leading-6">{recommendation(result)}</p><p className="mt-2 text-xs text-muted-foreground">El analisis identifica indicadores de riesgo y no sustituye un antivirus completo.</p></div>
      </div>

      <section aria-labelledby="file-summary"><h3 id="file-summary" className="text-lg font-semibold">Archivo</h3><dl className="mt-3 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
        <Meta label="Nombre" value={result.file.name} /><Meta label="Tamaño" value={formatBytes(result.file.size)} /><Meta label="Tipo detectado" value={result.file.detectedType.label} /><Meta label="Extension" value={result.file.extension} />
        <div className="min-w-0 sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SHA-256</dt><dd className="mt-1 flex min-w-0 items-start gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-muted p-2 text-xs">{result.sha256}</code><CopyButton value={result.sha256} compact toastMessage="SHA-256 copiado" /></dd></div>
      </dl></section>

      <section aria-labelledby="indicators"><div className="flex items-center justify-between gap-3"><h3 id="indicators" className="text-lg font-semibold">Indicadores encontrados</h3><span className="text-sm text-muted-foreground">{result.indicators.length}</span></div>
        {result.indicators.length ? <ul className="mt-3 space-y-3">{result.indicators.map((item) => <li key={item.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex min-w-0 gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden /><h4 className="font-semibold">{item.title}</h4></div><span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", severityClasses[item.severity])}>{severityLabels[item.severity]}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 break-words text-xs"><strong>Evidencia:</strong> {item.evidence}</p><p className="mt-1 text-sm"><strong>Que hacer:</strong> {item.recommendation}</p></li>)}</ul> : <div className="mt-3 flex gap-2 rounded-xl border border-success/30 bg-success-bg p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden /><p className="text-sm">No encontramos indicadores evidentes en las comprobaciones disponibles.</p></div>}
      </section>

      <details className="rounded-xl border border-border"><summary className="cursor-pointer p-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Detalles tecnicos</summary><dl className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">{Object.entries(result.details).map(([key, value]) => <Meta key={key} label={key.replace(/([A-Z])/g, " $1")} value={Array.isArray(value) ? value.join(", ") || "Ninguno" : String(value)} />)}<Meta label="Cobertura" value={result.partial ? "Analisis parcial" : "Analisis profundo disponible"} /><Meta label="Duracion del motor" value={`${result.durationMs} ms`} /></dl></details>
      <Button variant="outline" onClick={onAgain}><RotateCcw className="h-4 w-4" aria-hidden /> Analizar nuevamente</Button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>;
}

