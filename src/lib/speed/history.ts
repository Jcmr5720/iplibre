/**
 * Historial de pruebas guardado localmente en el navegador (localStorage).
 * Por privacidad, nunca se sube automáticamente a un servidor.
 */
import type { SpeedResult } from "@/lib/speed/types";
import { hasConsent } from "@/lib/privacy/consent";
import { SPEED_HISTORY_KEY } from "@/lib/privacy/storage-registry";

const MAX_ENTRIES = 50;

export interface HistoryEntry extends SpeedResult {
  id: string;
  isp?: string;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  if (!hasConsent("preferences")) return [];
  try {
    const raw = window.localStorage.getItem(SPEED_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: HistoryEntry): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  if (!hasConsent("preferences")) return [];
  const list = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(SPEED_HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
  return list;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SPEED_HISTORY_KEY);
  } catch {
    /* ignora */
  }
}
