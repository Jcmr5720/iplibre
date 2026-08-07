import {
  Activity,
  Gauge,
  Globe2,
  LockKeyhole,
  MapPin,
  Network,
  Repeat,
  ScanSearch,
  Server,
  Shield,
  Stethoscope,
} from "lucide-react";

/**
 * Icono por herramienta, indexado por `href`. Fuente única para el header,
 * el mega-menú, el drawer móvil y la cuadrícula de /herramientas.
 */
export const TOOL_ICONS: Record<string, React.ElementType> = {
  "/mi-ip": Globe2,
  "/test-de-velocidad": Gauge,
  "/diagnostico-de-internet": Stethoscope,
  "/test-ipv6": Network,
  "/geolocalizar-ip": MapPin,
  "/whois": ScanSearch,
  "/dns-lookup": Server,
  "/propagacion-dns": Repeat,
  "/asn-lookup": Network,
  "/reverse-dns": Server,
  "/estado-web": Activity,
  "/ssl-checker": LockKeyhole,
  "/headers-seguridad": Shield,
};

/** Icono de reserva cuando una ruta no tiene entrada en el mapa. */
export const FALLBACK_TOOL_ICON: React.ElementType = Globe2;
