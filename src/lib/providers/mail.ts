/**
 * Comprobación real de seguridad de correo (SPF, DKIM y DMARC) mediante
 * DNS-over-HTTPS. Orquesta las consultas TXT y delega el análisis en los
 * parsers puros de `@/lib/mail/*`.
 */
import { fetchWithTimeout } from "@/lib/http";
import { parseSpf, type SpfAnalysis } from "@/lib/mail/spf";
import { parseDmarc, type DmarcAnalysis } from "@/lib/mail/dmarc";
import { parseDkim, type DkimAnalysis } from "@/lib/mail/dkim";

const DOH = "https://dns.google/resolve";

interface DohAnswer {
  type: number;
  data: string;
}
interface DohJson {
  Status: number;
  Answer?: DohAnswer[];
}

/**
 * Reconstruye un TXT que el resolutor devuelve troceado en varias cadenas
 * entre comillas: `"parte1" "parte2"` → `parte1parte2`.
 */
function normalizeTxt(data: string): string {
  const segments = data.match(/"([^"]*)"/g);
  if (segments) return segments.map((s) => s.slice(1, -1)).join("");
  return data.replace(/^"|"$/g, "");
}

async function queryTxt(name: string): Promise<string[]> {
  const url = `${DOH}?name=${encodeURIComponent(name)}&type=TXT`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 7000,
    retries: 1,
    headers: { accept: "application/dns-json" },
  });
  if (!res.ok) throw new Error(`El resolutor DNS respondió ${res.status}`);
  const json = (await res.json()) as DohJson;
  return (json.Answer ?? []).filter((a) => a.type === 16).map((a) => normalizeTxt(a.data));
}

export type ComponentGrade = "correcto" | "mejorable" | "ausente" | "inválido" | "no comprobado";
export type OverallGrade = "Buena" | "Mejorable" | "Insuficiente";

export interface MailSecurityResult {
  domain: string;
  spf: SpfAnalysis;
  dmarc: DmarcAnalysis;
  dkim: DkimAnalysis | null;
  grades: { spf: ComponentGrade; dkim: ComponentGrade; dmarc: ComponentGrade };
  overall: OverallGrade;
  checkedAt: string;
}

function spfGrade(a: SpfAnalysis): ComponentGrade {
  if (!a.found) return "ausente";
  if (a.status === "invalid") return "inválido";
  if (a.status === "ok") return "correcto";
  return "mejorable";
}
function dmarcGrade(a: DmarcAnalysis): ComponentGrade {
  if (!a.found) return "ausente";
  if (a.status === "invalid") return "inválido";
  if (a.status === "ok") return "correcto";
  return "mejorable";
}
function dkimGrade(a: DkimAnalysis | null): ComponentGrade {
  if (!a) return "no comprobado";
  if (!a.found) return "ausente";
  if (a.status === "invalid") return "inválido";
  if (a.status === "ok") return "correcto";
  return "mejorable";
}

function overallGrade(g: { spf: ComponentGrade; dkim: ComponentGrade; dmarc: ComponentGrade }): OverallGrade {
  const bad = [g.spf, g.dmarc].filter((x) => x === "ausente" || x === "inválido").length;
  const meh = [g.spf, g.dmarc, g.dkim].filter((x) => x === "mejorable").length;
  if (bad >= 1) return "Insuficiente";
  if (meh >= 1 || g.dkim === "ausente") return "Mejorable";
  return "Buena";
}

export async function checkMailSecurity(
  domain: string,
  selector?: string,
): Promise<MailSecurityResult> {
  const [spfTxt, dmarcTxt, dkimTxt] = await Promise.all([
    queryTxt(domain),
    queryTxt(`_dmarc.${domain}`),
    selector ? queryTxt(`${selector}._domainkey.${domain}`) : Promise.resolve(null),
  ]);

  const spf = parseSpf(spfTxt);
  const dmarc = parseDmarc(dmarcTxt);
  const dkim = selector && dkimTxt ? parseDkim(dkimTxt, selector) : null;

  const grades = {
    spf: spfGrade(spf),
    dkim: dkimGrade(dkim),
    dmarc: dmarcGrade(dmarc),
  };

  return {
    domain,
    spf,
    dmarc,
    dkim,
    grades,
    overall: overallGrade(grades),
    checkedAt: new Date().toISOString(),
  };
}
