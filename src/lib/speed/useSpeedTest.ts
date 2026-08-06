"use client";

import * as React from "react";
import { runSpeedTest } from "@/lib/speed/engine";
import type { SpeedPhase, SpeedProgress, SpeedResult } from "@/lib/speed/types";
import { getProvider } from "@/lib/speed/engine";
import { shortId } from "@/lib/format";
import { clearHistory, loadHistory, saveEntry, type HistoryEntry } from "@/lib/speed/history";

export type Status = "idle" | "running" | "done" | "error" | "cancelled";

export function useSpeedTest(isp?: string) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState<SpeedProgress>({ phase: "idle", fraction: 0 });
  const [result, setResult] = React.useState<SpeedResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const controllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const start = React.useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("running");
    setError(null);
    setResult(null);
    setProgress({ phase: "latency", fraction: 0 });

    try {
      const res = await runSpeedTest({
        provider: getProvider("cloudflare"),
        signal: controller.signal,
        onProgress: (p) => setProgress(p),
      });
      setResult(res);
      setStatus("done");
      const entry: HistoryEntry = { ...res, id: shortId(), isp };
      setHistory(saveEntry(entry));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("cancelled");
        setProgress({ phase: "cancelled", fraction: 0 });
      } else {
        setStatus("error");
        setError(
          err instanceof Error
            ? "No se pudo completar la prueba. Puede que un bloqueador o la red lo impidan."
            : "Error desconocido.",
        );
        setProgress({ phase: "error", fraction: 0 });
      }
    }
  }, [isp]);

  const cancel = React.useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = React.useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setProgress({ phase: "idle", fraction: 0 });
  }, []);

  const clear = React.useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  return { status, progress, result, error, history, start, cancel, reset, clear };
}

export type { SpeedPhase };
