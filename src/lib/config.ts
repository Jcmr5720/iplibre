/**
 * Configuración central de IPLibre.
 * Fuente única de verdad para nombre, dominios, contacto y textos legales,
 * de modo que añadir datos reales de contacto más adelante no requiera
 * tocar cada página.
 */

/**
 * Dominio oficial y canónico de producción. Fuente única de verdad: cambiar
 * aquí (o vía NEXT_PUBLIC_SITE_URL) propaga a metadata, sitemap, robots,
 * Open Graph y JSON-LD sin tocar cada página.
 */
export const CANONICAL_URL = "https://iplibre.online";

export const siteConfig = {
  name: "IPLibre",
  slogan: "Descubre tu IP y mide la velocidad de tu Internet",
  description:
    "IPLibre es una plataforma gratuita de diagnóstico de Internet: consulta tu IP pública, mide la velocidad de tu conexión y analiza DNS, WHOIS, RDAP, ASN y geolocalización de IP.",
  // La URL canónica se resuelve en tiempo de ejecución (ver getBaseUrl).
  url: process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_URL,
  locale: "es",
  themeColor: {
    light: "#0e7490",
    dark: "#060b16",
  },
  // Datos de contacto: intencionadamente vacíos hasta disponer de información
  // real. La UI muestra un aviso honesto de "canal en configuración".
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    // Cuando exista un proveedor de correo (Resend, etc.) configurado por
    // variable de entorno, el formulario de contacto lo usará automáticamente.
  },
  author: "IPLibre",
  keywords: [
    "mi ip",
    "cuál es mi ip",
    "test de velocidad",
    "velocidad de internet",
    "geolocalización ip",
    "whois",
    "rdap",
    "dns lookup",
    "propagación dns",
    "asn lookup",
    "reverse dns",
    "diagnóstico de internet",
  ],
} as const;

/**
 * Resuelve la URL base en tiempo de ejecución. En Vercel usa VERCEL_URL
 * (deployment) o VERCEL_PROJECT_PRODUCTION_URL (producción) si no hay una
 * URL pública configurada explícitamente.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // En producción, la canónica es siempre el dominio oficial (nunca el
  // *.vercel.app), aunque falte la variable de entorno.
  if (process.env.VERCEL_ENV === "production") return CANONICAL_URL;
  // En deployments de preview usa la URL del deployment para poder navegar.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export const tools: NavItem[] = [
  { href: "/mi-ip", label: "Mi IP", description: "Tu dirección IP pública y datos de conexión" },
  { href: "/test-de-velocidad", label: "Test de velocidad", description: "Descarga, subida, ping y jitter reales" },
  { href: "/diagnostico-de-internet", label: "Diagnóstico", description: "Chequeo integral de tu conexión" },
  { href: "/geolocalizar-ip", label: "Geolocalizar IP", description: "Ubicación aproximada de una IP" },
  { href: "/whois", label: "WHOIS / RDAP", description: "Datos de dominios, IP y ASN" },
  { href: "/dns-lookup", label: "DNS Lookup", description: "Registros A, AAAA, MX, TXT y más" },
  { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara resolutores públicos" },
  { href: "/asn-lookup", label: "ASN Lookup", description: "Sistemas autónomos y prefijos" },
  { href: "/reverse-dns", label: "Reverse DNS", description: "Registro PTR de una IP" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Herramientas",
    items: tools.slice(0, 5),
  },
  {
    title: "Más herramientas",
    items: tools.slice(5),
  },
  {
    title: "IPLibre",
    items: [
      { href: "/herramientas", label: "Todas las herramientas" },
      { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
      { href: "/acerca-de", label: "Acerca de" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/terminos", label: "Términos de uso" },
      { href: "/privacidad", label: "Privacidad" },
      { href: "/cookies", label: "Cookies" },
      { href: "/aviso-legal", label: "Aviso legal" },
    ],
  },
];
