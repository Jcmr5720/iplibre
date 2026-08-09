/// <reference lib="webworker" />
import { analyzeBytes, bytesToHex } from "@/lib/file-analysis/engine";
import { MAX_FILE_BYTES } from "@/lib/file-analysis/constants";
import type { WorkerRequest, WorkerResponse } from "@/lib/file-analysis/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const send = (message: WorkerResponse) => ctx.postMessage(message);

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== "analyze") return;
  const { file } = event.data;
  try {
    if (file.size > MAX_FILE_BYTES) throw new Error("Este archivo supera el tamaño admitido para analisis local en este dispositivo.");
    send({ type: "progress", phase: "preparing", label: "Preparando archivo" });
    const buffer = await file.arrayBuffer();
    send({ type: "progress", phase: "hashing", label: "Calculando SHA-256" });
    const hash = bytesToHex(await crypto.subtle.digest("SHA-256", buffer));
    send({ type: "progress", phase: "detecting", label: "Detectando formato" });
    const started = performance.now();
    send({ type: "progress", phase: "analyzing", label: "Analizando estructura" });
    const result = analyzeBytes(new Uint8Array(buffer), { name: file.name, type: file.type });
    send({ type: "progress", phase: "scoring", label: "Evaluando indicadores" });
    send({ type: "result", result: { ...result, sha256: hash, durationMs: Math.round(performance.now() - started) } });
  } catch {
    send({ type: "error", message: "No pudimos analizar este archivo. Puede estar dañado o usar una estructura no admitida." });
  }
};

export {};

