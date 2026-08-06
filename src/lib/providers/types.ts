/** Tipos normalizados compartidos por los adaptadores de proveedores. */

export interface GeoInfo {
  ip: string;
  version: 4 | 6 | null;
  type?: string;
  isp?: string;
  org?: string;
  asn?: number;
  asnOrg?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postal?: string;
  timezone?: string;
  utcOffset?: string;
  latitude?: number;
  longitude?: number;
  flagEmoji?: string;
  // Solo se rellenan cuando la fuente lo indica explícitamente.
  isProxy?: boolean;
  isVpn?: boolean;
  isHosting?: boolean;
  isMobile?: boolean;
  source: string;
  fetchedAt: string;
}

export interface DnsAnswer {
  name: string;
  type: string;
  ttl: number;
  data: string;
  // Campos específicos parseados (MX/SRV).
  priority?: number;
  weight?: number;
  port?: number;
  target?: string;
}

export interface DnsResult {
  question: string;
  type: string;
  resolver: string;
  status: string;
  answers: DnsAnswer[];
  responseMs: number;
  authoritative?: boolean;
}
