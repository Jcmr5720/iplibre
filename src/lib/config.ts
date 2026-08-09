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

/**
 * Verificaciones de propiedad y publicidad. Fuente única de verdad para que la
 * metadata (Google Search Console) y ads.txt no queden desincronizados.
 */
export const verification = {
  google: "6oiOkE6VjEMaCmA9xY_axcB5dWIl35YioO7gomecuqI",
  adsenseClient: "ca-pub-1569989907195059",
} as const;

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

export type ToolCategory = "conexion" | "red" | "web" | "seguridad";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  category?: ToolCategory;
  /** Sinónimos y términos de búsqueda para el buscador de herramientas. */
  keywords?: string[];
};

export const tools: NavItem[] = [
  { href: "/mi-ip", label: "Mi IP", description: "Consulta tu dirección IP pública.", category: "conexion", keywords: ["ip", "ip publica", "mi direccion", "ipv4", "cual es mi ip", "direccion ip"] },
  { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide descarga, subida y latencia.", category: "conexion", keywords: ["velocidad", "speed test", "descarga", "subida", "ping", "jitter", "mbps", "internet", "banda ancha"] },
  { href: "/diagnostico-de-internet", label: "Diagnóstico", description: "Analiza el estado de tu conexión.", category: "conexion", keywords: ["diagnostico", "conexion", "estado", "internet", "problemas", "chequeo"] },
  { href: "/test-ipv6", label: "Test IPv6", description: "Comprueba compatibilidad IPv6.", category: "conexion", keywords: ["ipv6", "ip", "compatibilidad", "protocolo", "ipv4 vs ipv6"] },
  { href: "/webrtc-leak-test", label: "WebRTC Leak Test", description: "¿Tu navegador filtra tu IP?", category: "conexion", keywords: ["webrtc", "fuga", "leak", "vpn", "ip", "privacidad", "navegador", "ice", "stun", "filtracion"] },
  { href: "/geolocalizar-ip", label: "Geolocalizar IP", description: "Ubicación aproximada de una IP.", category: "red", keywords: ["ip", "geolocalizacion", "ubicacion", "geo", "localizar", "pais", "ciudad", "mapa"] },
  { href: "/whois", label: "WHOIS / RDAP", description: "Datos de dominios, IP y ASN.", category: "red", keywords: ["whois", "rdap", "dominio", "registro", "propietario", "titular"] },
  { href: "/dns-lookup", label: "DNS Lookup", description: "Registros A, AAAA, MX, TXT y más.", category: "red", keywords: ["dns", "registros", "lookup", "resolver", "mx", "txt", "nameserver", "dominio"] },
  { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara resolutores públicos.", category: "red", keywords: ["dns", "propagacion", "resolutores", "cambios dns", "global", "dominio"] },
  { href: "/asn-lookup", label: "ASN Lookup", description: "Sistemas autónomos y prefijos.", category: "red", keywords: ["asn", "sistema autonomo", "prefijos", "bgp", "operador", "red"] },
  { href: "/reverse-dns", label: "Reverse DNS", description: "Registro PTR de una IP.", category: "red", keywords: ["dns", "reverse", "ptr", "inverso", "ip", "hostname"] },
  { href: "/dnssec-checker", label: "DNSSEC Checker", description: "Autenticidad criptográfica del DNS.", category: "red", keywords: ["dnssec", "ds", "dnskey", "firma", "dns", "cadena de confianza", "validacion", "seguridad dns"] },
  { href: "/blacklist-checker", label: "Blacklist Checker", description: "¿La IP está en listas de reputación?", category: "red", keywords: ["blacklist", "lista negra", "dnsbl", "rbl", "reputacion", "spam", "ip", "spamhaus", "listas negras"] },
  { href: "/estado-web", label: "Estado web", description: "Comprueba si una web está disponible.", category: "web", keywords: ["web caida", "estado", "disponible", "up down", "http", "sitio", "monitor", "caida"] },
  { href: "/ssl-checker", label: "SSL Checker", description: "Comprueba el certificado HTTPS de un dominio.", category: "web", keywords: ["ssl", "tls", "certificado", "https", "seguridad", "caducidad", "cifrado"] },
  { href: "/headers-seguridad", label: "Headers de seguridad", description: "Qué protecciones HTTP usa una web.", category: "web", keywords: ["headers", "cabeceras", "seguridad", "csp", "hsts", "http", "proteccion"] },
  { href: "/redirect-checker", label: "Redirect Checker", description: "Sigue la cadena de redirecciones.", category: "web", keywords: ["redireccion", "redirect", "301", "302", "308", "cadena", "location", "http", "url", "redirecciones"] },
  { href: "/email-security-checker", label: "SPF, DKIM y DMARC", description: "Autenticación de correo de un dominio.", category: "seguridad", keywords: ["spf", "dkim", "dmarc", "correo", "email", "autenticacion", "phishing", "spoofing", "mail", "seguridad correo"] },
  { href: "/generador-contrasenas", label: "Generador de contraseñas", description: "Contraseñas seguras en tu navegador.", category: "seguridad", keywords: ["password", "contrasena", "clave", "clave segura", "generador", "aleatoria", "seguridad", "passphrase", "contraseñas"] },
];

/**
 * Herramientas primarias que se muestran como enlaces directos en la barra de
 * navegación (estilo PDFLibre). El resto vive en el mega-menú "Todas las
 * herramientas". Fuente única de verdad: cambiar los href aquí reordena el header.
 */
export const primaryTools: NavItem[] = ["/mi-ip", "/test-de-velocidad"]
  .map((href) => tools.find((t) => t.href === href))
  .filter((t): t is NavItem => Boolean(t));

/**
 * Selección destacada para la Home: mantiene visibles las herramientas
 * principales sin saturar con todo el catálogo. El resto se descubre en
 * /herramientas y en el mega-menú "Todas las herramientas".
 */
export const featuredTools: NavItem[] = [
  "/mi-ip",
  "/test-de-velocidad",
  "/webrtc-leak-test",
  "/test-ipv6",
  "/diagnostico-de-internet",
  "/geolocalizar-ip",
  "/whois",
  "/dns-lookup",
  "/ssl-checker",
  "/generador-contrasenas",
]
  .map((href) => tools.find((t) => t.href === href))
  .filter((t): t is NavItem => Boolean(t));

/** Herramientas agrupadas por categoría, para el menú y /herramientas. */
export const toolCategories: { id: ToolCategory; title: string; items: NavItem[] }[] = [
  { id: "conexion", title: "Mi conexión", items: tools.filter((t) => t.category === "conexion") },
  { id: "red", title: "Dominios y red", items: tools.filter((t) => t.category === "red") },
  { id: "web", title: "Sitios web", items: tools.filter((t) => t.category === "web") },
  { id: "seguridad", title: "Seguridad y utilidades", items: tools.filter((t) => t.category === "seguridad") },
];

/** Normaliza texto para búsqueda: minúsculas y sin acentos. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Buscador local de herramientas. Coincide por nombre, descripción y
 * sinónimos (keywords). Sin backend: filtra la fuente central `tools`.
 */
export function searchTools(query: string): NavItem[] {
  const q = normalize(query);
  if (!q) return tools;
  const terms = q.split(/\s+/).filter(Boolean);
  return tools.filter((t) => {
    const haystack = normalize(
      [t.label, t.description ?? "", ...(t.keywords ?? [])].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** Guías y páginas informativas ("Aprender"). Distintas de las herramientas. */
export const learnLinks: NavItem[] = [
  { href: "/que-es-mi-ip", label: "¿Qué es mi IP?", description: "Qué es una dirección IP y para qué sirve" },
  { href: "/que-es-dns", label: "¿Qué es DNS?", description: "La guía telefónica de Internet, explicada" },
  { href: "/que-es-el-ping", label: "¿Qué es el ping?", description: "Latencia y por qué importa" },
  { href: "/que-es-el-jitter", label: "¿Qué es el jitter?", description: "La estabilidad de tu conexión" },
  { href: "/ipv4-vs-ipv6", label: "IPv4 vs IPv6", description: "Diferencias entre ambos protocolos" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes", description: "Dudas habituales sobre red e Internet" },
];

/**
 * Enlaces institucionales de IPLibre para el menú secundario ("Más").
 */
export const aboutLinks: NavItem[] = [
  { href: "/acerca-de", label: "Acerca de", description: "Qué es IPLibre y cómo funciona" },
  { href: "/contacto", label: "Contacto", description: "Escríbenos tus dudas o sugerencias" },
  { href: "/donar", label: "Donar", description: "Apoya el mantenimiento de IPLibre" },
];

/**
 * Otras aplicaciones del ecosistema. Configuración reutilizable: añadir una
 * nueva app (SólidoLibre, etc.) es solo agregar un objeto aquí; el menú y el
 * footer se actualizan solos. No confundir con herramientas internas.
 */
export type RelatedApp = {
  name: string;
  href: string;
  tagline: string;
  description: string;
  cta: string;
};

export const relatedApps: RelatedApp[] = [
  {
    name: "PDFLibre",
    href: "https://pdflibre.app",
    tagline: "Todas tus herramientas PDF, gratis y desde el navegador.",
    description:
      "Edita, convierte, organiza y firma tus PDF directamente desde el navegador, sin instalar nada.",
    cta: "Explorar PDFLibre",
  },
];

/**
 * Estructura del mega-menú / drawer de navegación. Agrupa las rutas por
 * intención para no saturar el header con enlaces sueltos.
 */
export type MenuGroup = { title: string; items: NavItem[] };

export const menuGroups: MenuGroup[] = [
  ...toolCategories.map((c) => ({ title: c.title, items: c.items })),
  {
    title: "Aprender",
    items: learnLinks,
  },
  {
    title: "IPLibre",
    items: [
      { href: "/herramientas", label: "Todas las herramientas" },
      { href: "/acerca-de", label: "Acerca de" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Mi conexión",
    items: tools.filter((t) => t.category === "conexion"),
  },
  {
    title: "Dominios y red",
    items: tools.filter((t) => t.category === "red"),
  },
  {
    title: "Sitios web",
    items: tools.filter((t) => t.category === "web"),
  },
  {
    title: "Seguridad y utilidades",
    items: tools.filter((t) => t.category === "seguridad"),
  },
  {
    title: "Recursos",
    items: [
      { href: "/que-es-mi-ip", label: "¿Qué es mi IP?" },
      { href: "/que-es-dns", label: "¿Qué es DNS?" },
      { href: "/ipv4-vs-ipv6", label: "IPv4 vs IPv6" },
      { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
      { href: "/acerca-de", label: "Acerca de" },
      { href: "/donar", label: "Donar" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/terminos", label: "Términos de uso" },
      { href: "/privacidad", label: "Privacidad" },
      { href: "/cookies", label: "Cookies" },
      { href: "/aviso-legal", label: "Aviso legal" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
];
