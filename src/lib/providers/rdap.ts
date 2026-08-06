/**
 * Consultas RDAP (Registration Data Access Protocol) para dominios, IP y ASN.
 * Se usa el bootstrap de rdap.org, que redirige al servidor RDAP autoritativo
 * (IANA/RIR/registro). RDAP es el sucesor estandarizado y estructurado de WHOIS.
 */
import { fetchWithTimeout } from "@/lib/http";

const RDAP_BASE = "https://rdap.org";

export interface RdapEvent {
  action: string;
  date: string;
}

export interface RdapEntity {
  handle?: string;
  roles: string[];
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface RdapNormalized {
  objectType: "domain" | "ip network" | "autnum" | "unknown";
  handle?: string;
  name?: string;
  unicodeName?: string;
  status: string[];
  events: RdapEvent[];
  entities: RdapEntity[];
  nameservers?: string[];
  dnssec?: boolean;
  // Específicos de IP/ASN.
  startAddress?: string;
  endAddress?: string;
  cidr?: string[];
  ipVersion?: string;
  country?: string;
  type?: string;
  asnRange?: string;
  registrar?: string;
  links: { rel: string; href: string }[];
  source: string;
  raw: unknown;
}

interface RdapRaw {
  objectClassName?: string;
  handle?: string;
  ldhName?: string;
  unicodeName?: string;
  status?: string[];
  events?: { eventAction: string; eventDate: string }[];
  entities?: RdapRawEntity[];
  nameservers?: { ldhName?: string }[];
  secureDNS?: { delegationSigned?: boolean };
  startAddress?: string;
  endAddress?: string;
  cidr0_cidrs?: { v4prefix?: string; v6prefix?: string; length?: number }[];
  ipVersion?: string;
  country?: string;
  name?: string;
  type?: string;
  startAutnum?: number;
  endAutnum?: number;
  links?: { rel?: string; href?: string }[];
  port43?: string;
  errorCode?: number;
  title?: string;
}

interface RdapRawEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, unknown[]];
  entities?: RdapRawEntity[];
}

function parseVcard(vcard?: [string, unknown[]]): Partial<RdapEntity> {
  const out: Partial<RdapEntity> = {};
  if (!vcard || !Array.isArray(vcard[1])) return out;
  for (const entry of vcard[1] as unknown[]) {
    if (!Array.isArray(entry)) continue;
    const [prop, , , value] = entry as [string, unknown, string, unknown];
    if (prop === "fn" && typeof value === "string") out.name = value;
    if (prop === "org") {
      out.organization = Array.isArray(value) ? value.join(" ") : String(value);
    }
    if (prop === "email" && typeof value === "string") out.email = value;
    if (prop === "tel" && typeof value === "string") out.phone = value;
    if (prop === "adr") {
      if (Array.isArray(value)) out.address = value.filter(Boolean).join(", ");
    }
  }
  return out;
}

function normalizeEntities(entities?: RdapRawEntity[]): RdapEntity[] {
  if (!entities) return [];
  const out: RdapEntity[] = [];
  for (const e of entities) {
    const vc = parseVcard(e.vcardArray);
    out.push({
      handle: e.handle,
      roles: e.roles || [],
      name: vc.name,
      organization: vc.organization,
      email: vc.email,
      phone: vc.phone,
      address: vc.address,
    });
    // Entidades anidadas (p. ej. contactos dentro del registrador).
    if (e.entities) out.push(...normalizeEntities(e.entities));
  }
  return out;
}

function normalize(raw: RdapRaw): RdapNormalized {
  const entities = normalizeEntities(raw.entities);
  const events: RdapEvent[] = (raw.events || []).map((ev) => ({
    action: ev.eventAction,
    date: ev.eventDate,
  }));
  const cidr = (raw.cidr0_cidrs || [])
    .map((c) =>
      c.v4prefix
        ? `${c.v4prefix}/${c.length}`
        : c.v6prefix
          ? `${c.v6prefix}/${c.length}`
          : undefined,
    )
    .filter((x): x is string => Boolean(x));

  const registrar = entities.find((e) => e.roles.includes("registrar"));

  const objectType = ((): RdapNormalized["objectType"] => {
    if (raw.objectClassName === "domain") return "domain";
    if (raw.objectClassName === "ip network") return "ip network";
    if (raw.objectClassName === "autnum") return "autnum";
    return "unknown";
  })();

  return {
    objectType,
    handle: raw.handle,
    name: raw.ldhName || raw.name,
    unicodeName: raw.unicodeName,
    status: raw.status || [],
    events,
    entities,
    nameservers: raw.nameservers?.map((n) => (n.ldhName || "").replace(/\.$/, "")).filter(Boolean),
    dnssec: raw.secureDNS?.delegationSigned,
    startAddress: raw.startAddress,
    endAddress: raw.endAddress,
    cidr: cidr.length ? cidr : undefined,
    ipVersion: raw.ipVersion,
    country: raw.country,
    type: raw.type,
    asnRange:
      raw.startAutnum !== undefined
        ? raw.startAutnum === raw.endAutnum
          ? `AS${raw.startAutnum}`
          : `AS${raw.startAutnum} – AS${raw.endAutnum}`
        : undefined,
    registrar: registrar?.organization || registrar?.name,
    links: (raw.links || [])
      .filter((l) => l.href)
      .map((l) => ({ rel: l.rel || "related", href: l.href as string })),
    source: "RDAP (rdap.org bootstrap)",
    raw,
  };
}

async function rdapFetch(path: string): Promise<RdapRaw> {
  const res = await fetchWithTimeout(`${RDAP_BASE}${path}`, {
    timeoutMs: 9000,
    retries: 1,
    headers: { accept: "application/rdap+json, application/json" },
  });
  if (res.status === 404) {
    throw new RdapNotFoundError("El objeto consultado no existe o no está registrado.");
  }
  if (!res.ok) {
    throw new Error(`El servicio RDAP respondió ${res.status}`);
  }
  return (await res.json()) as RdapRaw;
}

export class RdapNotFoundError extends Error {}

export async function rdapDomain(domain: string): Promise<RdapNormalized> {
  return normalize(await rdapFetch(`/domain/${encodeURIComponent(domain)}`));
}

export async function rdapIp(ip: string): Promise<RdapNormalized> {
  return normalize(await rdapFetch(`/ip/${encodeURIComponent(ip)}`));
}

export async function rdapAutnum(asn: number): Promise<RdapNormalized> {
  return normalize(await rdapFetch(`/autnum/${asn}`));
}
