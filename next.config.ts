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
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://speed.cloudflare.com",
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
    return legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://iplibre.online/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
