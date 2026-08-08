import {
  Activity,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Network,
  Repeat,
  ScanSearch,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Wifi,
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
  "/webrtc-leak-test": Wifi,
  "/geolocalizar-ip": MapPin,
  "/whois": ScanSearch,
  "/dns-lookup": Server,
  "/propagacion-dns": Repeat,
  "/asn-lookup": Network,
  "/reverse-dns": Server,
  "/dnssec-checker": ShieldCheck,
  "/blacklist-checker": ShieldAlert,
  "/estado-web": Activity,
  "/ssl-checker": LockKeyhole,
  "/headers-seguridad": Shield,
  "/redirect-checker": Repeat,
  "/email-security-checker": Mail,
  "/generador-contrasenas": KeyRound,
};

/** Icono de reserva cuando una ruta no tiene entrada en el mapa. */
export const FALLBACK_TOOL_ICON: React.ElementType = Globe2;
