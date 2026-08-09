"use client";

import * as React from "react";
import { AlertTriangle, Check, CheckCircle2, Clock3, Download, FileSearch, FileUp, LoaderCircle, RotateCcw, ShieldCheck, Square, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { ANALYSIS_TIMEOUT_MS, MAX_FILE_BYTES } from "@/lib/file-analysis/constants";
import type { AnalysisResult, ProgressPhase, WorkerResponse } from "@/lib/file-analysis/types";
import { cn } from "@/lib/utils";

type Status = "empty" | "selected" | "working" | "complete" | "cancelled" | "error";

const progressSteps: { phase: ProgressPhase; label: string }[] = [
  { phase: "preparing", label: "Preparando archivo" },
  { phase: "hashing", label: "Calculando SHA-256" },
  { phase: "detecting", label: "Identificando formato" },
  { phase: "validating", label: "Validando estructura" },
  { phase: "content", label: "Analizando contenido" },
  { phase: "heuristics", label: "Buscando indicadores" },
  { phase: "scoring", label: "Evaluando riesgo" },
  { phase: "result", label: "Preparando resultado" },
];

const severityLabels = { informativa: "Informativa", baja: "Baja", media: "Media", alta: "Alta", critica: "Critica" } as const;
const confidenceLabels = { baja: "Limitada", media: "Media", alta: "Alta" } as const;
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

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

function importantCount(result: AnalysisResult): number {
  return result.indicators.filter((item) => item.severity === "alta" || item.severity === "critica").length;
}

function buildReport(result: AnalysisResult): string {
  const localDate = new Date().toLocaleString();
  const indicators = result.indicators.length ? result.indicators.map((item) => `- ${item.title}: ${item.evidence}`).join("\n") : "- Sin indicadores evidentes";
  return [
    "Resumen de analisis IPLibre",
    `Fecha local: ${localDate}`,
    `Archivo: ${result.file.name}`,
    `SHA-256: ${result.sha256}`,
    `Resultado: ${result.riskLevel}`,
    `Score: ${result.score}/100`,
    `Confianza: ${confidenceLabels[result.confidence]}`,
    `Cobertura: ${result.coverage.level}`,
    "Indicadores:",
    indicators,
  ].join("\n");
}

export function VirusAnalyzer() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = React.useRef(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<Status>("empty");
  const [dragging, setDragging] = React.useState(false);
  const [phase, setPhase] = React.useState<ProgressPhase>("preparing");
  const [phaseLabel, setPhaseLabel] = React.useState("Listo para analizar");
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [progress, setProgress] = React.useState<number | undefined>();
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState("");

  const stopTimers = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const stopWorker = React.useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    stopTimers();
  }, [stopTimers]);

  React.useEffect(() => stopWorker, [stopWorker]);

  const chooseFile = React.useCallback((next: File | undefined) => {
    stopWorker(); setResult(null); setError(""); setElapsedMs(0); setProgress(undefined);
    if (!next) return;
    setFile(next);
    if (next.size > MAX_FILE_BYTES) {
      setStatus("error");
      setError("Este archivo supera el tamano admitido para analisis local en este dispositivo.");
    } else {
      setStatus("selected"); setPhase("preparing"); setPhaseLabel("Listo para analizar");
    }
  }, [stopWorker]);

  const startAnalysis = React.useCallback(() => {
    if (!file || file.size > MAX_FILE_BYTES) return;
    stopWorker(); setStatus("working"); setError(""); setResult(null); setPhase("preparing"); setPhaseLabel("Preparando archivo"); setProgress(undefined);
    startedAtRef.current = performance.now();
    intervalRef.current = setInterval(() => setElapsedMs(performance.now() - startedAtRef.current), 100);
    const worker = new Worker(new URL("../../workers/file-analysis.worker.ts", import.meta.url), { type: "module", name: "iplibre-file-analysis" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === "progress") { setPhase(message.phase); setPhaseLabel(message.label); setProgress(message.progress); }
      if (message.type === "result") { setResult(message.result); setStatus("complete"); setPhase("result"); setPhaseLabel("Analisis finalizado"); setElapsedMs(message.result.durationMs); stopWorker(); }
      if (message.type === "error") { setError(message.message); setStatus("error"); stopWorker(); }
    };
    worker.onerror = () => { setError("No pudimos analizar este archivo. Intentalo de nuevo."); setStatus("error"); stopWorker(); };
    timeoutRef.current = setTimeout(() => { stopWorker(); setStatus("error"); setError("El analisis supero el tiempo seguro y fue detenido."); }, ANALYSIS_TIMEOUT_MS);
    worker.postMessage({ type: "analyze", file });
  }, [file, stopWorker]);

  const cancel = React.useCallback(() => { stopWorker(); setStatus("cancelled"); setPhaseLabel("Analisis cancelado"); setElapsedMs(0); }, [stopWorker]);
  const reset = React.useCallback(() => { stopWorker(); setFile(null); setResult(null); setError(""); setStatus("empty"); setElapsedMs(0); if (inputRef.current) inputRef.current.value = ""; }, [stopWorker]);

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
            className={cn("flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors", dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30")}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}
          >
            <FileUp className="h-11 w-11 text-primary" aria-hidden />
            <p className="mt-4 text-lg font-semibold">{dragging ? "Sueltalo para analizar" : "Arrastra un archivo aqui"}</p>
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
            {status === "working" && <AnalysisProgress phase={phase} label={phaseLabel} progress={progress} elapsedMs={elapsedMs} onCancel={cancel} />}
            {status === "cancelled" && <div role="status" className="rounded-xl border border-warning/40 bg-warning-bg p-4"><p className="font-semibold">Analisis cancelado</p><p className="mt-1 text-sm">El Worker fue detenido y el archivo se descarto del proceso. Puedes analizarlo nuevamente.</p><Button className="mt-3" size="sm" onClick={startAnalysis}><RotateCcw className="h-4 w-4" aria-hidden /> Analizar nuevamente</Button></div>}
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

function AnalysisProgress({ phase, label, progress, elapsedMs, onCancel }: { phase: ProgressPhase; label: string; progress?: number; elapsedMs: number; onCancel: () => void }) {
  const activeIndex = Math.max(0, progressSteps.findIndex((step) => step.phase === phase));
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-5" aria-live="polite" aria-busy="true">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="font-semibold">{label}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" aria-hidden /> Analizando durante {formatSeconds(elapsedMs)}</p></div>
        <Button variant="outline" size="sm" onClick={onCancel}><Square className="h-3.5 w-3.5" aria-hidden /> Cancelar</Button>
      </div>
      {typeof progress === "number" ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div> : <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label}><div className="h-full w-1/3 animate-[shimmer_1.4s_infinite] rounded-full bg-primary" /></div>}
      <ol className="mt-5 grid gap-2 sm:grid-cols-2">
        {progressSteps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return <li key={step.phase} className="flex items-center gap-2 text-sm"><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", done ? "border-success bg-success-bg text-success" : active ? "border-primary text-primary" : "border-border text-muted-foreground")}>{done ? <Check className="h-3.5 w-3.5" aria-hidden /> : active ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><span className={active ? "font-semibold" : "text-muted-foreground"}>{step.label}</span></li>;
        })}
      </ol>
    </div>
  );
}

function AnalysisResults({ result, onAgain }: { result: AnalysisResult; onAgain: () => void }) {
  const risky = result.score >= 40;
  const important = importantCount(result);
  const report = React.useMemo(() => buildReport(result), [result]);
  const downloadReport = React.useCallback(() => {
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `iplibre-analisis-${result.sha256.slice(0, 12)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [report, result.sha256]);

  return (
    <div className="space-y-6" data-testid="analysis-result" aria-live="polite">
      <div className={cn("grid gap-5 rounded-xl border p-5 motion-safe:animate-[fadeIn_.22s_ease-out] md:grid-cols-[160px_1fr] md:items-center", risky ? "border-danger/30 bg-danger-bg/40" : result.score >= 20 ? "border-warning/35 bg-warning-bg/40" : "border-success/30 bg-success-bg/40")}>
        <ScoreRing score={result.score} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Resultado general</p>
          <h3 className="mt-1 text-2xl font-bold">{result.riskLevel}</h3>
          <p className="mt-2 text-sm leading-6">{result.summary}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Pill label={`${important} indicador(es) importante(s)`} />
            <Pill label={`${result.positiveChecks.length} verificaciones superadas`} />
            <Pill label={`Confianza: ${confidenceLabels[result.confidence]}`} />
            <Pill label={`Cobertura: ${result.coverage.level}`} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Analisis completado en {formatSeconds(result.durationMs)}. No sustituye un antivirus completo.</p>
        </div>
      </div>

      <section aria-labelledby="file-summary"><h3 id="file-summary" className="text-lg font-semibold">Archivo</h3><dl className="mt-3 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
        <Meta label="Nombre" value={result.file.name} /><Meta label="Tamano" value={formatBytes(result.file.size)} /><Meta label="Tipo detectado" value={result.file.detectedType.label} /><Meta label="Extension" value={result.file.extension} />
        <div className="min-w-0 sm:col-span-2"><dt className="text-xs font-medium uppercase text-muted-foreground">SHA-256</dt><dd className="mt-1 flex min-w-0 items-start gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-muted p-2 text-xs">{result.sha256}</code><CopyButton value={result.sha256} compact toastMessage="SHA-256 copiado" /></dd></div>
      </dl></section>

      <details className="rounded-xl border border-border"><summary className="cursor-pointer p-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Por que obtuve esta puntuacion?</summary><ul className="space-y-2 border-t border-border p-4">{result.scoreBreakdown.length ? result.scoreBreakdown.map((item) => <li key={item.id} className="flex gap-3 text-sm"><span className="w-12 shrink-0 font-mono font-bold text-primary">+{item.weight}</span><span className="min-w-0"><span className="font-medium">{item.label}</span><span className="ml-2 text-xs text-muted-foreground">Confianza {confidenceLabels[item.confidence]}</span></span></li>) : <li className="text-sm text-muted-foreground">No hubo indicadores con peso de riesgo.</li>}</ul></details>

      <section aria-labelledby="indicators"><div className="flex items-center justify-between gap-3"><h3 id="indicators" className="text-lg font-semibold">Indicadores encontrados</h3><span className="text-sm text-muted-foreground">{result.indicators.length}</span></div>
        {result.indicators.length ? <ul className="mt-3 space-y-3">{result.indicators.map((item) => <li key={item.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex min-w-0 gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden /><h4 className="font-semibold">{item.title}</h4></div><span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", severityClasses[item.severity])}>{severityLabels[item.severity]}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 break-words text-xs"><strong>Evidencia:</strong> {item.evidence}</p><p className="mt-1 text-xs text-muted-foreground">Confianza del indicador: {confidenceLabels[item.confidence]}</p><p className="mt-1 text-sm"><strong>Que hacer:</strong> {item.recommendation}</p></li>)}</ul> : <div className="mt-3 flex gap-2 rounded-xl border border-success/30 bg-success-bg p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden /><p className="text-sm">No encontramos indicadores evidentes en las comprobaciones disponibles.</p></div>}
      </section>

      <section aria-labelledby="positive-checks"><h3 id="positive-checks" className="text-lg font-semibold">Verificaciones superadas</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{result.positiveChecks.map((item) => <li key={item.id} className="flex gap-2 rounded-xl border border-success/25 bg-success-bg/60 p-3 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /><span>{item.label}</span></li>)}</ul></section>

      <section aria-labelledby="coverage"><h3 id="coverage" className="text-lg font-semibold">Cobertura del analisis</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{result.coverage.items.map((item) => <li key={item.label} className="rounded-xl border border-border p-3 text-sm"><span className="font-medium">{item.label}</span><span className="ml-2 text-muted-foreground">{item.status.replace("_", " ")}</span>{item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}</li>)}</ul></section>

      <details className="rounded-xl border border-border"><summary className="cursor-pointer p-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Detalles tecnicos</summary><dl className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">{Object.entries(result.details).map(([key, value]) => <Meta key={key} label={key.replace(/([A-Z])/g, " $1")} value={Array.isArray(value) ? value.join(", ") || "Ninguno" : String(value)} />)}</dl></details>
      <div className="flex flex-col gap-2 sm:flex-row"><CopyButton value={report} label="Copiar resumen" copiedLabel="Resumen copiado" toastMessage="Resumen copiado" /><Button variant="outline" onClick={downloadReport}><Download className="h-4 w-4" aria-hidden /> Descargar informe .txt</Button><Button variant="outline" onClick={onAgain}><RotateCcw className="h-4 w-4" aria-hidden /> Analizar nuevamente</Button></div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return <div className="flex items-center gap-4 md:flex-col md:text-center"><div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${score * 3.6}deg, var(--color-muted) 0deg)` }} aria-label={`Puntuacion ${score} de 100`}><div className="grid h-20 w-20 place-items-center rounded-full bg-card"><span className="text-2xl font-bold">{score}</span><span className="sr-only">de 100</span></div></div><p className="text-sm font-semibold">{score} / 100</p></div>;
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">{label}</span>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>;
}
