/**
 * Detección ligera de navegador, sistema operativo y dispositivo a partir
 * del user agent. Solo se ejecuta en el cliente. No es fingerprinting: no se
 * combinan señales para identificar de forma única al usuario.
 */

export interface ClientInfo {
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
  language: string;
  languages: string[];
  online: boolean;
  connectionType?: string;
  cores?: number;
  touch: boolean;
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Google Chrome";
  if (/Chromium/.test(ua)) return "Chromium";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  return "Desconocido";
}

function detectOs(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS / iPadOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Desconocido";
}

function detectDevice(ua: string): string {
  if (/iPad|Tablet/.test(ua)) return "Tableta";
  if (/Mobi|Android|iPhone/.test(ua)) return "Teléfono";
  return "Ordenador";
}

export function getClientInfo(): ClientInfo {
  const nav = navigator;
  const ua = nav.userAgent || "";
  const conn = (nav as Navigator & { connection?: { effectiveType?: string } }).connection;
  return {
    userAgent: ua,
    browser: detectBrowser(ua),
    os: detectOs(ua),
    deviceType: detectDevice(ua),
    language: nav.language || "—",
    languages: Array.from(nav.languages || []),
    online: nav.onLine,
    connectionType: conn?.effectiveType,
    cores: nav.hardwareConcurrency,
    touch: (nav.maxTouchPoints || 0) > 0,
  };
}
