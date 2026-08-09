import type { Page } from "@playwright/test";

/**
 * Infraestructura E2E: mocks de API deterministas (con contenido LARGO para
 * las pruebas de overflow) y utilidades compartidas. Todos los endpoints usan
 * el envoltorio { ok: true, data } de la API real.
 */

const ok = (data: unknown) => JSON.stringify({ ok: true, data });

// Cadenas largas para estresar el layout (overflow con datos reales).
const LONG_IPV6 = "2606:4700:4700:1111:2222:3333:4444:5555";
const LONG_TXT =
  "v=spf1 include:_spf.google.com include:mailgun.org include:servers.mcsv.net include:_spf.example-very-long-subdomain.com ip4:203.0.113.0/24 ip4:198.51.100.0/24 ~all";
const LONG_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA" + "u1SU1LfVLPHCozMxH2Mo".repeat(8);
const LONG_URL =
  "https://www.ejemplo-con-un-dominio-bastante-largo.com/ruta/muy/larga/con/muchos/segmentos?parametro=valor&otro=1234567890";

/** GeoInfo de ejemplo con IPv6 larga para probar overflow. */
const geo = {
  ip: LONG_IPV6,
  version: 6,
  type: "IPv6",
  isp: "Cloudflare, Inc. — proveedor con un nombre razonablemente largo",
  org: "Cloudflare",
  asn: 13335,
  asnOrg: "CLOUDFLARENET",
  country: "Estados Unidos",
  countryCode: "US",
  region: "California",
  city: "San Francisco",
  postal: "94107",
  timezone: "America/Los_Angeles",
  utcOffset: "-08:00",
  latitude: 37.7749,
  longitude: -122.4194,
  flagEmoji: "🇺🇸",
  source: "mock",
  fetchedAt: new Date().toISOString(),
};

const dnsResult = (type: string, values: { name: string; data: string; ttl?: number }[]) => ({
  question: "ejemplo.com",
  type,
  resolver: "Cloudflare (1.1.1.1)",
  status: "NOERROR",
  answers: values.map((v) => ({ name: v.name, type, ttl: v.ttl ?? 300, data: v.data })),
  responseMs: 42,
  authoritative: true,
});

/** Mapa de mocks por pathname del endpoint. */
const HANDLERS: Record<string, unknown> = {
  "/api/ip": geo,
  "/api/geo": geo,
  "/api/dns": {
    domain: "ejemplo.com",
    unicode: "ejemplo.com",
    resolver: "Cloudflare (1.1.1.1)",
    results: [
      dnsResult("A", [{ name: "ejemplo.com", data: "93.184.216.34" }]),
      dnsResult("AAAA", [{ name: "ejemplo.com", data: LONG_IPV6 }]),
      dnsResult("TXT", [{ name: "ejemplo.com", data: LONG_TXT }]),
      dnsResult("MX", [{ name: "ejemplo.com", data: "10 aspmx.l.google.com" }]),
    ],
  },
  "/api/propagation": {
    domain: "ejemplo.com",
    unicode: "ejemplo.com",
    type: "A",
    resolvers: [
      { resolverId: "cloudflare", resolver: "Cloudflare (1.1.1.1)", location: "Anycast", status: "NOERROR", responseMs: 30, values: ["93.184.216.34"] },
      { resolverId: "google", resolver: "Google (8.8.8.8)", location: "Anycast", status: "NOERROR", responseMs: 45, values: ["93.184.216.34"] },
      { resolverId: "quad9", resolver: "Quad9 (9.9.9.9)", location: "Anycast", status: "NOERROR", responseMs: 60, values: [LONG_IPV6] },
    ],
    summary: { total: 3, answered: 3, distinctAnswers: 2, agreementPct: 66, consistent: false },
  },
  "/api/rdap": {
    kind: "domain",
    input: "ejemplo.com",
    unicode: "ejemplo.com",
    objectType: "domain",
    handle: "EXAMPLE-DOMAIN-1234567890",
    name: "ejemplo.com",
    status: ["client transfer prohibited", "server delete prohibited"],
    events: [
      { action: "registration", date: "1995-08-14T04:00:00Z" },
      { action: "expiration", date: "2030-08-13T04:00:00Z" },
    ],
    entities: [
      { roles: ["registrar"], handle: "REG-1", vcard: { fn: "Registrador Internacional con Nombre Largo S.A." } },
    ],
    nameservers: ["a.iana-servers.net", "b.iana-servers.net"],
    dnssec: true,
    registrar: "Registrador Internacional con Nombre Largo S.A.",
    links: [],
    source: "rdap.org",
    raw: {},
  },
  "/api/asn": {
    via: "ip",
    mapping: { ip: "8.8.8.8", prefix: "8.8.8.0/24", asn: 15169, asnName: "GOOGLE", asnDescription: "Google LLC", rir: "ARIN", country: "US", source: "mock" },
    info: {
      asn: 15169,
      name: "GOOGLE",
      description: "Google LLC — un operador global con una descripción deliberadamente larga para probar el ajuste de texto",
      country: "US",
      rir: "ARIN",
      website: "https://google.com",
      ipv4Prefixes: [{ prefix: "8.8.8.0/24" }, { prefix: "8.8.4.0/24" }],
      ipv6Prefixes: [{ prefix: "2001:4860::/32" }],
      source: "mock",
    },
    rdap: null,
  },
  "/api/reverse-dns": {
    mode: "reverse",
    ip: "8.8.8.8",
    reverseName: "8.8.8.8.in-addr.arpa",
    resolver: "Cloudflare (1.1.1.1)",
    responseMs: 40,
    status: "NOERROR",
    hostnames: ["dns.google", "un-hostname-inverso-bastante-largo.ejemplo-dominio.com"],
    hasPtr: true,
  },
  "/api/ssl": {
    host: "ejemplo.com",
    found: true,
    state: "secure",
    stateLabel: "Seguro",
    valid: true,
    hostnameValid: true,
    expired: false,
    notYetValid: false,
    daysRemaining: 88,
    subjectCommonName: "ejemplo.com",
    subjectAltNames: ["ejemplo.com", "www.ejemplo.com", "*.subdominio-con-nombre-largo.ejemplo.com", "api.ejemplo.com", "cdn.ejemplo.com"],
    issuer: "Let's Encrypt — R3",
    validFrom: "2026-05-01T00:00:00Z",
    validTo: "2026-11-01T00:00:00Z",
    serialNumber: "04:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89",
    fingerprintSha256: "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
    protocol: "TLSv1.3",
    chain: [
      { subject: "ejemplo.com", issuer: "R3", validFrom: "2026-05-01", validTo: "2026-11-01" },
      { subject: "R3", issuer: "ISRG Root X1", validFrom: "2020-09-04", validTo: "2025-09-15" },
    ],
    checkedAt: new Date().toISOString(),
  },
  "/api/site-status": {
    input: "ejemplo.com",
    finalUrl: "https://ejemplo.com/",
    protocol: "https",
    httpsAvailable: true,
    status: 200,
    statusText: "OK",
    statusClass: "ok",
    state: "up",
    stateLabel: "Funcionando",
    stateDetail: "El sitio responde correctamente.",
    reachable: true,
    responseMs: 123,
    redirected: true,
    redirectCount: 1,
    redirectChain: [{ from: "http://ejemplo.com/", to: "https://ejemplo.com/", status: 301 }],
    server: "cloudflare",
    contentType: "text/html; charset=utf-8",
    ipAddresses: [LONG_IPV6],
    checkedAt: new Date().toISOString(),
  },
  "/api/security-headers": {
    reachable: true,
    input: "ejemplo.com",
    finalUrl: "https://ejemplo.com/",
    status: 200,
    score: 79,
    maxScore: 100,
    rating: "Buena",
    checks: [
      { key: "csp", name: "Content-Security-Policy", present: true, value: LONG_TXT, status: "ok", importance: "alta", weight: 25, earned: 25, description: "Restringe orígenes.", recommendation: "Mantén la política estricta." },
      { key: "hsts", name: "Strict-Transport-Security", present: true, value: "max-age=63072000; includeSubDomains; preload", status: "ok", importance: "alta", weight: 20, earned: 20, description: "Fuerza HTTPS.", recommendation: "Correcto." },
      { key: "xcto", name: "X-Content-Type-Options", present: false, status: "missing", importance: "media", weight: 10, earned: 0, description: "Evita sniffing.", recommendation: "Añade nosniff." },
    ],
    informational: [{ name: "Server", value: "cloudflare", note: "Servidor" }],
    csp: { present: true, findings: [{ severity: "note", message: "Usa 'unsafe-inline' en script-src." }] },
    hsts: { present: true, maxAge: 63072000, includeSubDomains: true, preload: true, notes: [] },
  },
  "/api/dnssec": {
    domain: "ejemplo.com",
    unicode: "ejemplo.com",
    classification: { state: "active-validated", label: "DNSSEC activo y validado", detail: "El dominio tiene delegación firmada (DS) y claves (DNSKEY), y un resolutor validante autentica sus respuestas." },
    hasDnskey: true,
    hasDs: true,
    authenticated: true,
    bogus: false,
    soaStatus: "NOERROR",
    dnskeys: [
      { flags: 257, protocol: 3, algorithm: 13, algorithmName: "ECDSA P-256/SHA-256", role: "KSK", publicKey: LONG_KEY },
      { flags: 256, protocol: 3, algorithm: 13, algorithmName: "ECDSA P-256/SHA-256", role: "ZSK", publicKey: LONG_KEY },
    ],
    ds: [{ keyTag: 2371, algorithm: 13, algorithmName: "ECDSA P-256/SHA-256", digestType: 2, digestTypeName: "SHA-256", digest: "3AC3FD7DBE5C6A3FBE5C6A3F3AC3FD7DBE5C6A3FBE5C6A3F3AC3FD7DBE5C6A3F" }],
    checkedAt: new Date().toISOString(),
  },
  "/api/email-security": {
    domain: "ejemplo.com",
    unicode: "ejemplo.com",
    spf: { status: "ok", found: true, record: LONG_TXT, multipleRecords: false, mechanisms: [{ qualifier: "+", type: "include", value: "_spf.google.com", causesLookup: true }], includes: ["_spf.google.com", "mailgun.org", "servers.mcsv.net"], ip4: ["203.0.113.0/24"], ip6: [], allQualifier: "~", allPolicy: "Fallo suave (~all)", redirect: null, exp: null, dnsLookups: 4, observations: [{ tone: "info", text: "~all marca el correo no autorizado como sospechoso." }] },
    dmarc: { status: "ok", found: true, record: "v=DMARC1; p=reject; rua=mailto:agg@ejemplo.com; adkim=s; aspf=s", policy: "reject", subdomainPolicy: null, pct: 100, rua: ["mailto:agg@ejemplo.com"], ruf: [], adkim: "s", aspf: "s", fo: null, tags: {}, observations: [{ tone: "success", text: "p=reject es la política más protectora." }] },
    dkim: { status: "ok", found: true, selector: "google", record: `v=DKIM1; k=rsa; p=${LONG_KEY}`, version: "DKIM1", keyType: "rsa", publicKey: LONG_KEY, hashAlgorithms: ["sha256"], flags: [], serviceTypes: [], tags: {}, observations: [{ tone: "success", text: "Clave pública DKIM válida." }] },
    grades: { spf: "correcto", dkim: "correcto", dmarc: "correcto" },
    overall: "Buena",
    checkedAt: new Date().toISOString(),
  },
  "/api/blacklist": {
    ip: "8.8.8.8",
    state: "clean",
    stateLabel: "Sin coincidencias detectadas",
    listedCount: 0,
    cleanCount: 11,
    errorCount: 1,
    total: 12,
    results: [
      { zone: "zen.spamhaus.org", name: "Spamhaus ZEN", outcome: "error", responses: [], detail: "La lista rechazó la consulta (posible resolutor no admitido)." },
      { zone: "bl.spamcop.net", name: "SpamCop", outcome: "clean", responses: [] },
      { zone: "dnsbl.sorbs.net", name: "SORBS", outcome: "clean", responses: [] },
    ],
    checkedAt: new Date().toISOString(),
  },
  "/api/redirect": {
    input: "http://ejemplo.com",
    initialUrl: "http://ejemplo.com/",
    finalUrl: LONG_URL,
    finalStatus: 200,
    finalStatusText: "OK",
    hops: [
      { index: 0, url: "http://ejemplo.com/", method: "HEAD", status: 301, statusText: "Movido permanentemente", statusClass: "redirect", redirectKind: "permanent", redirectLabel: "301 Permanente", resolvedLocation: "https://ejemplo.com/", https: false, responseMs: 120, ipAddresses: ["93.184.216.34"] },
      { index: 1, url: LONG_URL, method: "HEAD", status: 200, statusText: "OK", statusClass: "ok", https: true, responseMs: 90, ipAddresses: [LONG_IPV6] },
    ],
    redirectCount: 1,
    totalMs: 210,
    loopDetected: false,
    tooMany: false,
    startedHttp: true,
    endedHttps: true,
    upgradedToHttps: true,
    downgradedToHttp: false,
    checkedAt: new Date().toISOString(),
  },
  "/api/donations/create-preference": { init_point: "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=MOCK-PREF-123" },
};

/**
 * Intercepta /api/** y responde con datos mock deterministas y largos.
 * create-preference se devuelve tal cual (sin envoltorio ok/data).
 */
export async function mockApis(page: Page): Promise<void> {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === "/api/donations/create-preference") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(HANDLERS[path]),
      });
      return;
    }
    const data = HANDLERS[path];
    if (data === undefined) {
      await route.fulfill({ status: 200, contentType: "application/json", body: ok({}) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: ok(data) });
  });
  // El checkout de Mercado Pago no debe navegar fuera del sitio en E2E.
  await page.route("https://www.mercadopago.com.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>MOCK CHECKOUT MERCADOPAGO</body></html>" }),
  );
}

/** Fuerza un error de API (para probar estados de error). */
export async function mockApiError(page: Page, status = 502): Promise<void> {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "La fuente externa no está disponible.", errorId: "TEST" }),
    }),
  );
}

/** Viewports de la matriz de QA. */
export const VIEWPORTS = [
  { label: "320x568", width: 320, height: 568 },
  { label: "360x640", width: 360, height: 640 },
  { label: "375x667", width: 375, height: 667 },
  { label: "390x844", width: 390, height: 844 },
  { label: "412x915", width: 412, height: 915 },
  { label: "430x932", width: 430, height: 932 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1024x768", width: 1024, height: 768 },
  { label: "1366x768", width: 1366, height: 768 },
  { label: "1440x900", width: 1440, height: 900 },
  { label: "1920x1080", width: 1920, height: 1080 },
] as const;

/** Rutas de herramientas públicas. */
export const TOOL_ROUTES = [
  "/mi-ip",
  "/test-de-velocidad",
  "/diagnostico-de-internet",
  "/test-ipv6",
  "/webrtc-leak-test",
  "/geolocalizar-ip",
  "/whois",
  "/dns-lookup",
  "/propagacion-dns",
  "/asn-lookup",
  "/reverse-dns",
  "/dnssec-checker",
  "/blacklist-checker",
  "/estado-web",
  "/ssl-checker",
  "/headers-seguridad",
  "/redirect-checker",
  "/email-security-checker",
  "/generador-contrasenas",
] as const;

export const ALL_ROUTES = ["/", "/herramientas", ...TOOL_ROUTES, "/donar"] as const;

/** Herramientas que auto-consultan una IP/dominio de ejemplo al escribirlo. */
export async function submitExample(page: Page): Promise<void> {
  const example = page.locator("button", { hasText: /^\d|ejemplo|cloudflare|google|github|iplibre/ }).first();
  if (await example.count()) {
    await example.click();
  }
}

/** Aplica el tema y espera a que se refleje en <html>. */
export async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  const label = theme === "dark" ? "Oscuro" : "Claro";
  await page.getByRole("radio", { name: label }).first().click();
  const cls = theme === "dark" ? /dark/ : /light/;
  await page.locator("html").evaluate(
    (el, t) => el.classList.contains(t),
    theme,
  );
  await page.waitForFunction((t) => document.documentElement.classList.contains(t), theme);
  void cls;
}

/** Comprueba que no hay overflow horizontal. */
export async function expectNoOverflow(page: Page): Promise<{ scrollW: number; innerW: number }> {
  return page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
}
