/**
 * Resolución DNS mediante DNS-over-HTTPS (DoH), compatible con el entorno
 * serverless de Vercel (no requiere sockets UDP). Se soportan varios
 * resolutores públicos para poder comparar propagación.
 */
import { fetchWithTimeout } from "@/lib/http";
import type { DnsAnswer, DnsResult } from "@/lib/providers/types";

export const DNS_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SOA",
  "SRV",
  "CAA",
  "PTR",
  "DS",
  "DNSKEY",
] as const;

export type DnsRecordType = (typeof DNS_TYPES)[number];

const TYPE_TO_NUM: Record<string, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  DS: 43,
  DNSKEY: 48,
  CAA: 257,
};

const NUM_TO_TYPE: Record<number, string> = Object.fromEntries(
  Object.entries(TYPE_TO_NUM).map(([k, v]) => [v, k]),
);

const RCODE: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
};

export interface Resolver {
  id: string;
  name: string;
  location: string;
  buildUrl: (name: string, type: string) => string;
}

export const resolvers: Resolver[] = [
  {
    id: "cloudflare",
    name: "Cloudflare (1.1.1.1)",
    location: "Red global (anycast)",
    buildUrl: (name, type) =>
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  },
  {
    id: "google",
    name: "Google (8.8.8.8)",
    location: "Red global (anycast)",
    buildUrl: (name, type) =>
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
  },
  {
    id: "quad9",
    name: "Quad9 (9.9.9.9)",
    location: "Red global (anycast)",
    buildUrl: (name, type) =>
      `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  },
];

export function getResolver(id: string): Resolver | undefined {
  return resolvers.find((r) => r.id === id);
}

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  AD?: boolean;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
}

function parseAnswer(a: DohAnswer): DnsAnswer {
  const typeName = NUM_TO_TYPE[a.type] || String(a.type);
  const base: DnsAnswer = {
    name: a.name.replace(/\.$/, ""),
    type: typeName,
    ttl: a.TTL,
    data: a.data,
  };
  if (typeName === "MX") {
    const [prio, ...rest] = a.data.split(" ");
    base.priority = Number(prio);
    base.target = rest.join(" ").replace(/\.$/, "");
    base.data = `${prio} ${base.target}`;
  } else if (typeName === "SRV") {
    const [prio, weight, port, ...target] = a.data.split(" ");
    base.priority = Number(prio);
    base.weight = Number(weight);
    base.port = Number(port);
    base.target = target.join(" ").replace(/\.$/, "");
  } else if (typeName === "TXT") {
    base.data = a.data.replace(/^"|"$/g, "");
  }
  return base;
}

/**
 * Realiza una consulta DoH a un resolutor concreto.
 * `name` debe venir ya normalizado y validado por quien llama.
 */
export async function queryDns(
  name: string,
  type: DnsRecordType,
  resolver: Resolver,
): Promise<DnsResult> {
  const started = Date.now();
  const res = await fetchWithTimeout(resolver.buildUrl(name, type), {
    timeoutMs: 7000,
    retries: 1,
    headers: { accept: "application/dns-json" },
  });
  const responseMs = Date.now() - started;
  if (!res.ok) {
    throw new Error(`El resolutor ${resolver.name} respondió ${res.status}`);
  }
  const json = (await res.json()) as DohResponse;
  const answers = (json.Answer || [])
    .filter((a) => NUM_TO_TYPE[a.type] === type || type === "PTR")
    .map(parseAnswer);
  // Para SOA se busca también en la sección de autoridad.
  const authority = type === "SOA" ? (json.Authority || []).map(parseAnswer) : [];
  return {
    question: name,
    type,
    resolver: resolver.name,
    status: RCODE[json.Status] ?? `CODE_${json.Status}`,
    answers: answers.length ? answers : authority,
    responseMs,
    authoritative: json.AD,
  };
}

export { TYPE_TO_NUM, NUM_TO_TYPE };
