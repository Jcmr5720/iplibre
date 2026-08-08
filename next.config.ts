import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad aplicadas a todas las respuestas.
 *
 * Sobre la CSP y `script-src`:
 * Next.js (App Router con Turbopack) inyecta scripts de arranque en línea para
 * la hidratación. La propagación de nonce por petición no es fiable en esta
 * versión, por lo que usamos `'unsafe-inline'` en `script-src`. El riesgo XSS
 * se mantiene bajo porque toda la entrada de usuario se renderiza como texto
 * (React escapa por defecto) y el JSON-LD es estático y controlado. El resto
 * de la política se mantiene estricta (object-src none, frame-ancestors none,
 * base-uri self, form-action self, connect-src acotado).
 */
const csp = [
  "default-src 'self'",
  // Google AdSense: dominios necesarios para el script oficial y los anuncios.
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://*.adtrafficquality.google",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google",
  "font-src 'self' data:",
  // connect-src: incluye endpoints IPv4/IPv6 (icanhazip) para el Test IPv6 y
  // servidores STUN para la prueba de fuga WebRTC (descubrimiento de IP srflx).
  "connect-src 'self' https://speed.cloudflare.com https://ipv4.icanhazip.com https://ipv6.icanhazip.com stun: stun.cloudflare.com stun.l.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google",
  // frame-src: los anuncios de AdSense se renderizan en iframes de Google.
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://*.adtrafficquality.google",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * Consolidación de dominio hacia el canónico https://iplibre.online.
   * La redirección www → apex la gestiona además Vercel a nivel de dominio;
   * estas reglas cubren el dominio *.vercel.app y actúan como respaldo, sin
   * afectar a preview deployments (que usan hosts con hash únicos).
   */
  async redirects() {
    const legacyHosts = ["iplibre.vercel.app", "www.iplibre.online"];
    const hostRedirects = legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://iplibre.online/:path*",
      permanent: true,
    }));

    /**
     * Consolidación de intenciones de búsqueda muy próximas hacia su página
     * canónica, para evitar contenido duplicado que compita entre sí.
     */
    const canonicalRedirects = [
      { source: "/mi-ip-publica", destination: "/cual-es-mi-ip", permanent: true },
      { source: "/test-de-internet", destination: "/medir-velocidad-internet", permanent: true },
    ];

    return [...hostRedirects, ...canonicalRedirects];
  },
};

export default nextConfig;
