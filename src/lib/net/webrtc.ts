/**
 * Análisis de candidatos ICE de WebRTC (parte pura y testable).
 *
 * La prueba real se ejecuta en el navegador del visitante con
 * `RTCPeerConnection` (ver el componente cliente). Aquí solo vive la lógica de
 * parseo y clasificación, sin acceso a red, para poder probarla en aislamiento.
 *
 * Notas de honestidad técnica:
 *  - Los navegadores modernos (Chrome, Firefox) ocultan las IP locales tras
 *    nombres mDNS `*.local`. Eso NO es una IP privada: es una ofuscación de
 *    privacidad y así se etiqueta.
 *  - Descubrir la IP pública reflejada (srflx) requiere un servidor STUN. Si el
 *    navegador o la red lo bloquean, solo veremos candidatos host mDNS.
 */
import { isIPv4, isIPv6, isPrivateOrReservedIp } from "@/lib/net/ip";

export type CandidateType = "host" | "srflx" | "prflx" | "relay" | "unknown";

export interface ParsedCandidate {
  raw: string;
  type: CandidateType;
  protocol: "udp" | "tcp" | "unknown";
  address: string;
  port: number | null;
  ipVersion: 4 | 6 | null;
  /** El address es un nombre mDNS `*.local` (IP local ofuscada). */
  isMdns: boolean;
  /** El address es una IP (no mDNS) privada/reservada. */
  isPrivate: boolean;
  /** El address es una IP pública enrutable. */
  isPublic: boolean;
}

/**
 * Parsea una línea de candidato ICE (formato SDP `candidate:...`).
 * Devuelve null si no tiene la forma esperada.
 *
 * Ejemplo:
 *   candidate:1 1 udp 2122260223 192.0.2.10 49923 typ srflx raddr 0.0.0.0 rport 0
 */
export function parseCandidate(input: string): ParsedCandidate | null {
  if (typeof input !== "string") return null;
  const line = input.trim().replace(/^a=/, "");
  const body = line.startsWith("candidate:") ? line.slice("candidate:".length) : line;
  const parts = body.split(/\s+/);
  // foundation component protocol priority address port "typ" type ...
  if (parts.length < 8) return null;

  const protocolRaw = (parts[2] || "").toLowerCase();
  const protocol: ParsedCandidate["protocol"] =
    protocolRaw === "udp" || protocolRaw === "tcp" ? protocolRaw : "unknown";
  const address = parts[4] || "";
  const port = Number.parseInt(parts[5], 10);
  const typIndex = parts.indexOf("typ");
  const typeRaw = typIndex >= 0 ? (parts[typIndex + 1] || "").toLowerCase() : "";
  const type: CandidateType =
    typeRaw === "host" || typeRaw === "srflx" || typeRaw === "prflx" || typeRaw === "relay"
      ? typeRaw
      : "unknown";

  const isMdns = /\.local$/i.test(address);
  const v4 = isIPv4(address);
  const v6 = isIPv6(address);
  const ipVersion = v4 ? 4 : v6 ? 6 : null;
  const isIp = v4 || v6;
  const isPrivate = isIp && isPrivateOrReservedIp(address);
  const isPublic = isIp && !isPrivate;

  return {
    raw: line,
    type,
    protocol,
    address,
    port: Number.isFinite(port) ? port : null,
    ipVersion,
    isMdns,
    isPrivate,
    isPublic,
  };
}

export type WebrtcState = "noLeak" | "possibleLeak" | "restricted" | "unknown";

export interface WebrtcAnalysis {
  state: WebrtcState;
  stateLabel: string;
  summary: string;
  /** IP públicas que WebRTC ha revelado (srflx/relay/host público). */
  publicIps: string[];
  /** IP privadas/locales reveladas directamente (no mDNS). Fuga de red local. */
  privateIps: string[];
  /** Nº de candidatos host ofuscados con mDNS. */
  mdnsCount: number;
  /** ¿Alguna IP pública difiere de la IP pública que ve el servidor? */
  exposesDifferentIp: boolean;
  candidates: ParsedCandidate[];
}

const STATE_LABELS: Record<WebrtcState, string> = {
  noLeak: "Sin fuga aparente",
  possibleLeak: "Posible exposición",
  restricted: "WebRTC restringido",
  unknown: "No se pudo determinar",
};

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

/**
 * Clasifica el conjunto de candidatos frente a la IP pública que el servidor
 * observa para este visitante (`serverPublicIp`, puede ser null si no se pudo
 * obtener). No decide nada sobre VPN: solo compara direcciones observadas.
 */
export function analyzeCandidates(
  candidates: ParsedCandidate[],
  serverPublicIp: string | null,
): WebrtcAnalysis {
  const publicIps = uniq(candidates.filter((c) => c.isPublic).map((c) => c.address));
  const privateIps = uniq(
    candidates.filter((c) => c.isPrivate && !c.isMdns).map((c) => c.address),
  );
  const mdnsCount = candidates.filter((c) => c.isMdns).length;

  const differentPublic = serverPublicIp
    ? publicIps.filter((ip) => ip !== serverPublicIp)
    : [];
  const exposesDifferentIp = differentPublic.length > 0;

  let state: WebrtcState;
  let summary: string;

  if (candidates.length === 0) {
    state = "unknown";
    summary =
      "No se obtuvo ningún candidato ICE. Es posible que WebRTC esté desactivado, bloqueado por una extensión o no disponible en este navegador.";
  } else if (privateIps.length > 0) {
    // Revelar una IP privada/local directa es una fuga de red local.
    state = "possibleLeak";
    summary =
      "WebRTC reveló una o más direcciones de tu red local. Algunos navegadores antiguos o configuraciones exponen la IP privada del dispositivo.";
  } else if (publicIps.length === 0) {
    // Solo candidatos mDNS o ninguna IP pública: el navegador protegió tu IP.
    state = "restricted";
    summary =
      mdnsCount > 0
        ? "Tu navegador ocultó las direcciones locales mediante mDNS y no se expuso ninguna IP pública adicional a través de WebRTC."
        : "No se expuso ninguna dirección IP pública a través de los candidatos WebRTC observados.";
  } else if (serverPublicIp && exposesDifferentIp) {
    state = "possibleLeak";
    summary =
      "WebRTC expuso una dirección diferente de la IP pública principal que vemos. Si utilizas una VPN o proxy, revisa la configuración de privacidad de tu navegador.";
  } else if (serverPublicIp && !exposesDifferentIp) {
    state = "noLeak";
    summary =
      "WebRTC solo reveló la misma IP pública que el sitio ya conoce por tu conexión. No supone una exposición adicional.";
  } else {
    // Hay IP pública pero no pudimos compararla con la del servidor.
    state = "unknown";
    summary =
      "WebRTC reveló una IP pública, pero no se pudo compararla con la IP que ve el servidor para confirmar si supone una exposición adicional.";
  }

  return {
    state,
    stateLabel: STATE_LABELS[state],
    summary,
    publicIps,
    privateIps,
    mdnsCount,
    exposesDifferentIp,
    candidates,
  };
}

/** Etiqueta legible del tipo de candidato. */
export function candidateTypeLabel(type: CandidateType): string {
  switch (type) {
    case "host":
      return "Host (local)";
    case "srflx":
      return "Reflexivo (srflx)";
    case "prflx":
      return "Reflexivo por pares (prflx)";
    case "relay":
      return "Retransmitido (relay)";
    default:
      return "Desconocido";
  }
}
