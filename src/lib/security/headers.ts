/**
 * Evaluación de cabeceras de seguridad HTTP.
 *
 * La puntuación es TRANSPARENTE: cada cabecera aporta un peso explícito
 * (HEADER_CHECKS). La suma de pesos es 100. No constituye una auditoría de
 * seguridad; solo analiza la presencia y calidad básica de ciertos encabezados.
 *
 * Criterio moderno: una CSP con `frame-ancestors` restrictivo cubre
 * funcionalmente a X-Frame-Options, por lo que no se penaliza su ausencia.
 */
import { analyzeCsp, cspRestrictsFraming, type CspAnalysis } from "@/lib/security/csp";
import { analyzeHsts, type HstsAnalysis } from "@/lib/security/hsts";

export type HeaderStatus = "ok" | "partial" | "missing" | "info";
export type Importance = "alta" | "media" | "baja";

export interface HeaderCheckResult {
  key: string;
  name: string;
  present: boolean;
  value?: string;
  status: HeaderStatus;
  importance: Importance;
  weight: number;
  earned: number;
  description: string;
  recommendation: string;
}

export interface HeadersReport {
  score: number;
  maxScore: number;
  rating: "Excelente" | "Buena" | "Mejorable" | "Débil";
  checks: HeaderCheckResult[];
  informational: { name: string; value: string; note: string }[];
  csp: CspAnalysis;
  hsts: HstsAnalysis;
  checkedAt: string;
}

type HeaderGetter = (name: string) => string | null;

interface HeaderCheckDef {
  key: string;
  name: string;
  importance: Importance;
  weight: number;
  description: string;
  recommendation: string;
  /** Evalúa la calidad: 1 = completo, 0..1 parcial, 0 ausente/inefectivo. */
  evaluate: (value: string | null, get: HeaderGetter) => number;
}

const HEADER_CHECKS: HeaderCheckDef[] = [
  {
    key: "content-security-policy",
    name: "Content-Security-Policy",
    importance: "alta",
    weight: 25,
    description:
      "Restringe qué recursos puede cargar la página. Ayuda a mitigar XSS e inyección de contenido.",
    recommendation:
      "Define una CSP con default-src y evita 'unsafe-inline'/'unsafe-eval' cuando sea posible.",
    evaluate: (value) => {
      if (!value) return 0;
      const csp = analyzeCsp(value);
      const hasError = csp.findings.some((f) => f.severity === "error");
      const hasWarning = csp.findings.some((f) => f.severity === "warning");
      if (hasError) return 0.4;
      if (hasWarning) return 0.75;
      return 1;
    },
  },
  {
    key: "strict-transport-security",
    name: "Strict-Transport-Security",
    importance: "alta",
    weight: 20,
    description: "Obliga al navegador a usar HTTPS en futuras visitas (evita ataques de degradación).",
    recommendation: "Usa max-age ≥ 15552000 e incluye includeSubDomains.",
    evaluate: (value) => {
      const h = analyzeHsts(value);
      if (!h.present) return 0;
      if (h.longEnough && h.includeSubDomains) return 1;
      if (h.longEnough) return 0.75;
      return 0.5;
    },
  },
  {
    key: "x-content-type-options",
    name: "X-Content-Type-Options",
    importance: "media",
    weight: 10,
    description: "Evita que el navegador adivine el tipo de contenido (MIME sniffing).",
    recommendation: "Añade el valor nosniff.",
    evaluate: (value) => (value && value.toLowerCase().includes("nosniff") ? 1 : 0),
  },
  {
    key: "x-frame-options",
    name: "X-Frame-Options",
    importance: "media",
    weight: 10,
    description: "Evita que la página se incruste en iframes de terceros (clickjacking).",
    recommendation:
      "Usa DENY o SAMEORIGIN, o define frame-ancestors en la CSP (alternativa moderna equivalente).",
    evaluate: (value, get) => {
      const csp = get("content-security-policy");
      if (cspRestrictsFraming(csp)) return 1; // CSP frame-ancestors cubre esta protección
      if (!value) return 0;
      const v = value.toLowerCase();
      return v.includes("deny") || v.includes("sameorigin") ? 1 : 0.5;
    },
  },
  {
    key: "referrer-policy",
    name: "Referrer-Policy",
    importance: "media",
    weight: 10,
    description: "Controla cuánta información de origen se envía al navegar a otros sitios.",
    recommendation: "Usa strict-origin-when-cross-origin o no-referrer.",
    evaluate: (value) => {
      if (!value) return 0;
      const v = value.toLowerCase();
      const weak = v.includes("unsafe-url") || v === "";
      return weak ? 0.5 : 1;
    },
  },
  {
    key: "permissions-policy",
    name: "Permissions-Policy",
    importance: "media",
    weight: 10,
    description: "Limita el acceso a APIs del navegador (cámara, micrófono, geolocalización…).",
    recommendation: "Declara una política que desactive las capacidades que no uses.",
    evaluate: (value) => (value ? 1 : 0),
  },
  {
    key: "cross-origin-opener-policy",
    name: "Cross-Origin-Opener-Policy",
    importance: "baja",
    weight: 5,
    description: "Aísla el contexto de navegación de otros orígenes (protege frente a fugas).",
    recommendation: "Usa same-origin cuando tu aplicación lo permita.",
    evaluate: (value) => (value ? 1 : 0),
  },
  {
    key: "cross-origin-resource-policy",
    name: "Cross-Origin-Resource-Policy",
    importance: "baja",
    weight: 5,
    description: "Controla qué orígenes pueden cargar tus recursos.",
    recommendation: "Usa same-origin o same-site según tu caso.",
    evaluate: (value) => (value ? 1 : 0),
  },
  {
    key: "cross-origin-embedder-policy",
    name: "Cross-Origin-Embedder-Policy",
    importance: "baja",
    weight: 5,
    description: "Exige que los recursos incrustados concedan permiso explícito.",
    recommendation: "Usa require-corp si necesitas aislamiento total (opcional).",
    evaluate: (value) => (value ? 1 : 0),
  },
];

function statusFrom(present: boolean, earnedRatio: number): HeaderStatus {
  if (!present && earnedRatio === 0) return "missing";
  if (earnedRatio >= 1) return "ok";
  if (earnedRatio <= 0) return "missing";
  return "partial";
}

export function analyzeSecurityHeaders(get: HeaderGetter): HeadersReport {
  const checks: HeaderCheckResult[] = HEADER_CHECKS.map((def) => {
    const value = get(def.key);
    const ratio = Math.max(0, Math.min(1, def.evaluate(value, get)));
    const earned = Math.round(def.weight * ratio);
    // La presencia se evalúa por el propio header salvo XFO cubierto por CSP.
    const present = def.key === "x-frame-options" ? ratio > 0 : Boolean(value);
    return {
      key: def.key,
      name: def.name,
      present,
      value: value ?? undefined,
      status: statusFrom(Boolean(value), ratio),
      importance: def.importance,
      weight: def.weight,
      earned,
      description: def.description,
      recommendation: def.recommendation,
    };
  });

  const score = checks.reduce((sum, c) => sum + c.earned, 0);
  const maxScore = HEADER_CHECKS.reduce((sum, c) => sum + c.weight, 0);

  const rating: HeadersReport["rating"] =
    score >= 90 ? "Excelente" : score >= 75 ? "Buena" : score >= 50 ? "Mejorable" : "Débil";

  const informational: HeadersReport["informational"] = [];
  const server = get("server");
  const poweredBy = get("x-powered-by");
  if (server) {
    informational.push({
      name: "Server",
      value: server,
      note: "Expone el software del servidor; considera ocultar la versión.",
    });
  }
  if (poweredBy) {
    informational.push({
      name: "X-Powered-By",
      value: poweredBy,
      note: "Revela la tecnología del backend; se recomienda eliminar esta cabecera.",
    });
  }

  return {
    score,
    maxScore,
    rating,
    checks,
    informational,
    csp: analyzeCsp(get("content-security-policy")),
    hsts: analyzeHsts(get("strict-transport-security")),
    checkedAt: new Date().toISOString(),
  };
}
