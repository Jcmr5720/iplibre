/**
 * Información de Sistemas Autónomos (ASN) y enrutamiento.
 * Capa de proveedores intercambiables:
 *   1) RIPEstat (stat.ripe.net) — HTTPS, sin clave, alta disponibilidad.
 *   2) BGPView (api.bgpview.io) — HTTPS, sin clave, como respaldo.
 * Si el primero falla, se intenta el segundo.
 */
import { fetchJson } from "@/lib/http";

export interface AsnPrefix {
  prefix: string;
  name?: string;
  country?: string;
}

export interface AsnInfo {
  asn: number;
  name?: string;
  description?: string;
  country?: string;
  rir?: string;
  website?: string;
  ipv4Prefixes: AsnPrefix[];
  ipv6Prefixes: AsnPrefix[];
  source: string;
}

export interface IpToAsn {
  ip: string;
  prefix?: string;
  asn?: number;
  asnName?: string;
  asnDescription?: string;
  rir?: string;
  country?: string;
  source: string;
}

/* --------------------------------- RIPEstat -------------------------------- */

interface RipeOverview {
  data: {
    holder?: string;
    announced?: boolean;
    block?: { desc?: string; name?: string };
  };
}
interface RipePrefixes {
  data: { prefixes?: { prefix: string }[] };
}
interface RipePrefixOverview {
  data: {
    resource?: string;
    asns?: { asn: number; holder?: string }[];
  };
}

function rirFromDesc(desc?: string): string | undefined {
  if (!desc) return undefined;
  const m = desc.match(/by\s+([A-Z]+)/);
  return m ? m[1] : desc;
}

function splitPrefixes(prefixes: string[]): { v4: AsnPrefix[]; v6: AsnPrefix[] } {
  const v4: AsnPrefix[] = [];
  const v6: AsnPrefix[] = [];
  for (const p of prefixes) {
    (p.includes(":") ? v6 : v4).push({ prefix: p });
  }
  return { v4, v6 };
}

async function ripeAsn(asn: number): Promise<AsnInfo> {
  const [overview, prefixes] = await Promise.all([
    fetchJson<RipeOverview>(
      `https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`,
      { timeoutMs: 9000, retries: 1 },
    ),
    fetchJson<RipePrefixes>(
      `https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`,
      { timeoutMs: 9000 },
    ).catch(() => ({ data: { prefixes: [] } }) as RipePrefixes),
  ]);

  const holder = overview.data.holder;
  const all = (prefixes.data.prefixes || []).map((p) => p.prefix);
  const { v4, v6 } = splitPrefixes(all);

  return {
    asn,
    name: holder,
    description: holder,
    rir: rirFromDesc(overview.data.block?.desc),
    ipv4Prefixes: v4.slice(0, 300),
    ipv6Prefixes: v6.slice(0, 300),
    source: "RIPEstat",
  };
}

async function ripeIpToAsn(ip: string): Promise<IpToAsn> {
  const res = await fetchJson<RipePrefixOverview>(
    `https://stat.ripe.net/data/prefix-overview/data.json?resource=${encodeURIComponent(ip)}`,
    { timeoutMs: 9000, retries: 1 },
  );
  const first = res.data.asns?.[0];
  return {
    ip,
    prefix: res.data.resource,
    asn: first?.asn,
    asnName: first?.holder,
    asnDescription: first?.holder,
    source: "RIPEstat",
  };
}

/* --------------------------------- BGPView --------------------------------- */

interface BgpAsnResponse {
  status: string;
  data: {
    asn: number;
    name?: string;
    description_short?: string;
    country_code?: string;
    website?: string;
    rir_allocation?: { rir_name?: string };
  };
}
interface BgpPrefixesResponse {
  status: string;
  data: {
    ipv4_prefixes?: { prefix: string; name?: string; country_code?: string }[];
    ipv6_prefixes?: { prefix: string; name?: string; country_code?: string }[];
  };
}
interface BgpIpResponse {
  status: string;
  data: {
    prefixes?: { prefix: string; asn?: { asn: number; name?: string; description?: string } }[];
    rir_allocation?: { rir_name?: string };
    country_code?: string;
  };
}

const BGPVIEW = "https://api.bgpview.io";

async function bgpAsn(asn: number): Promise<AsnInfo> {
  const [info, prefixes] = await Promise.all([
    fetchJson<BgpAsnResponse>(`${BGPVIEW}/asn/${asn}`, { timeoutMs: 8000 }),
    fetchJson<BgpPrefixesResponse>(`${BGPVIEW}/asn/${asn}/prefixes`, { timeoutMs: 8000 }).catch(
      () => ({ status: "error", data: {} }) as BgpPrefixesResponse,
    ),
  ]);
  if (info.status !== "ok") throw new Error("BGPView sin datos");
  const d = info.data;
  const p = prefixes.data;
  return {
    asn: d.asn,
    name: d.name,
    description: d.description_short,
    country: d.country_code,
    rir: d.rir_allocation?.rir_name,
    website: d.website,
    ipv4Prefixes: (p.ipv4_prefixes || []).slice(0, 300).map((x) => ({ prefix: x.prefix, name: x.name, country: x.country_code })),
    ipv6Prefixes: (p.ipv6_prefixes || []).slice(0, 300).map((x) => ({ prefix: x.prefix, name: x.name, country: x.country_code })),
    source: "BGPView",
  };
}

async function bgpIpToAsn(ip: string): Promise<IpToAsn> {
  const res = await fetchJson<BgpIpResponse>(`${BGPVIEW}/ip/${encodeURIComponent(ip)}`, { timeoutMs: 8000 });
  if (res.status !== "ok") throw new Error("BGPView sin datos");
  const first = res.data.prefixes?.[0];
  return {
    ip,
    prefix: first?.prefix,
    asn: first?.asn?.asn,
    asnName: first?.asn?.name,
    asnDescription: first?.asn?.description,
    rir: res.data.rir_allocation?.rir_name,
    country: res.data.country_code,
    source: "BGPView",
  };
}

/* --------------------------------- Público --------------------------------- */

export async function lookupAsn(asn: number): Promise<AsnInfo> {
  try {
    return await ripeAsn(asn);
  } catch {
    return await bgpAsn(asn);
  }
}

export async function ipToAsn(ip: string): Promise<IpToAsn> {
  try {
    const result = await ripeIpToAsn(ip);
    if (result.asn) return result;
    return await bgpIpToAsn(ip);
  } catch {
    return await bgpIpToAsn(ip);
  }
}
