"use client";

import * as React from "react";
import { apiGet } from "@/lib/api-client";

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  code?: string;
}

/** Hook genérico para consultas GET a la API con cancelación y estados. */
export function useApiQuery<T>() {
  const [state, setState] = React.useState<State<T>>({
    data: null,
    error: null,
    loading: false,
  });
  const controllerRef = React.useRef<AbortController | null>(null);

  const run = React.useCallback(async (path: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ data: null, error: null, loading: true });
    const res = await apiGet<T>(path, controller.signal);
    if (controller.signal.aborted) return;
    if (res.ok) {
      setState({ data: res.data, error: null, loading: false });
    } else if (res.code !== "aborted") {
      setState({ data: null, error: res.error, loading: false, code: res.code });
    }
  }, []);

  const reset = React.useCallback(() => {
    controllerRef.current?.abort();
    setState({ data: null, error: null, loading: false });
  }, []);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, run, reset };
}
