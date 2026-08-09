import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator, PositiveCheck } from "../types";

function utf16Strings(bytes: Uint8Array, limit = 200): string[] {
  const strings: string[] = [];
  let current: number[] = [];
  for (let i = 0; i + 1 < bytes.length && strings.length < limit; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (code >= 32 && code < 127) current.push(code);
    else {
      if (current.length >= 4) strings.push(String.fromCharCode(...current));
      current = [];
    }
  }
  if (current.length >= 4) strings.push(String.fromCharCode(...current));
  return strings;
}

export function analyzeLnk(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails; checks: PositiveCheck[]; partial: boolean } {
  const strings = utf16Strings(bytes).slice(0, 80);
  const joined = strings.join("\n");
  const command = /(?:powershell|pwsh|cmd\.exe|wscript|cscript|mshta|rundll32|regsvr32)/i.test(joined);
  const url = /https?:\/\/[^\s"'<>)]{4,}/i.test(joined);
  const encoded = /-(?:enc|encodedcommand)\b/i.test(joined);
  const indicators: Indicator[] = [];
  const checks: PositiveCheck[] = [];
  if (command && (url || encoded)) {
    indicators.push(indicator("lnk-command-target", "alta", "Acceso directo con comando sospechoso", "El LNK contiene comandos de sistema con URL o argumento codificado visible.", strings.find((item) => /powershell|cmd\.exe|mshta|https?:\/\//i.test(item)) ?? "Comando visible en strings UTF-16", "archivo", "No abras este acceso directo salvo que conozcas exactamente su destino.", "media", "script"));
  }
  if (!command) checks.push({ id: "lnk-no-command", label: "No encontramos comandos de sistema visibles" });
  if (!url) checks.push({ id: "lnk-no-url", label: "No encontramos URL remota visible" });
  return { indicators, checks, details: { stringsInspected: strings.length, hasCommandTarget: command, hasUrlTarget: url, hasEncodedArgument: encoded }, partial: true };
}
