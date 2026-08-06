/**
 * Historial de pruebas guardado localmente en el navegador (localStorage).
 * Por privacidad, nunca se sube automáticamente a un servidor.
 */
import type { SpeedResult } from "@/lib/speed/types";

const KEY = "iplibre:speed-history:v1";
const MAX_ENTRIES = 50;

export interface HistoryEntry extends SpeedResult {
  id: string;
  isp?: string;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: HistoryEntry): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const list = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
  return list;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
