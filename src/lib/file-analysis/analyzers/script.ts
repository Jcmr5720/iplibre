import { MAX_TEXT_BYTES } from "../constants";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator, PositiveCheck } from "../types";

export type ScriptSignals = {
  longBase64: boolean;
  encodedCommand: boolean;
  dynamicExecution: boolean;
  download: boolean;
  execution: boolean;
  persistence: boolean;
  securityChange: boolean;
  lolbinRemote: boolean;
  urlCount: number;
};

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

export function analyzeScript(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails; checks: PositiveCheck[]; signals: ScriptSignals } {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const indicators: Indicator[] = [];
  const checks: PositiveCheck[] = [];
  const minifiedLike = text.length > 2000 && text.split(/\r?\n/).length <= 3 && /[{}();=]/.test(text);
  const signals: ScriptSignals = {
    longBase64: /[A-Za-z0-9+/]{300,}={0,2}/.test(text),
    encodedCommand: /(?:powershell|pwsh)[^\r\n]{0,160}-(?:enc|encodedcommand)\b/i.test(text),
    dynamicExecution: /\b(?:eval|Function)\s*\(|Invoke-Expression|\biex\b|execute\s*\(|CreateObject\(["']MSScriptControl/i.test(text),
    download: /(?:https?:\/\/|Invoke-WebRequest|Invoke-RestMethod|DownloadString|DownloadFile|curl\s|wget\s|bitsadmin)/i.test(text),
    execution: /(?:Start-Process|WScript\.Shell|ShellExecute|child_process|cmd\.exe|powershell(?:\.exe)?|chmod\s+\+x|mshta(?:\.exe)?|rundll32(?:\.exe)?|regsvr32(?:\.exe)?)/i.test(text),
    persistence: /(?:CurrentVersion\\Run|schtasks|crontab|Startup\\|New-Service|LaunchAgents|systemd\/system)/i.test(text),
    securityChange: /(?:Set-MpPreference|DisableRealtimeMonitoring|netsh\s+advfirewall|Add-MpPreference|sc\s+stop\s+WinDefend)/i.test(text),
    lolbinRemote: /(?:certutil[^\r\n]{0,120}(?:-urlcache|-decode|http)|mshta[^\r\n]{0,120}https?:\/\/|regsvr32[^\r\n]{0,160}https?:\/\/|rundll32[^\r\n]{0,160}javascript:)/i.test(text),
    urlCount: countMatches(text, /https?:\/\/[^\s"'<>)]{4,}/gi),
  };

  if (signals.longBase64 && !minifiedLike) {
    indicators.push(indicator("script-obfuscation", "media", "Bloque codificado en script", "Se detecto un bloque Base64 largo. Es una senal moderada cuando no parece minificacion normal.", "Bloque Base64 largo", "script", "Revisa el contenido decodificado en un entorno seguro antes de ejecutar.", "media", "base64"));
  }
  if (signals.encodedCommand) {
    indicators.push(indicator("script-encoded-command", "alta", "Comando PowerShell codificado", "Los comandos codificados ocultan lo que se ejecutara y requieren especial precaucion.", "PowerShell con -EncodedCommand", "script", "No ejecutes el script sin decodificar y revisar el comando.", "alta", "script"));
  }
  if (signals.dynamicExecution) {
    indicators.push(indicator("script-dynamic-execution", "media", "Ejecucion dinamica de codigo", "El script contiene mecanismos capaces de interpretar codigo construido durante la ejecucion.", "eval, Function, Invoke-Expression o equivalente", "script", "Inspecciona el contenido que llegaria a esa llamada antes de ejecutar.", "media", "script"));
  }
  if (signals.download && signals.execution) {
    indicators.push(indicator("script-download-execute", "alta", "Descarga combinada con ejecucion", "La combinacion puede obtener contenido remoto y ejecutarlo; es mas relevante que cualquiera de las senales por separado.", "Patrones de red y creacion de procesos", "script", "No ejecutes el archivo hasta validarlo con una solucion antivirus completa.", "alta", "script"));
  }
  if (signals.persistence || signals.securityChange) {
    indicators.push(indicator("script-persistence", "alta", "Cambios persistentes o de seguridad", "Se encontraron instrucciones relacionadas con arranque automatico, tareas programadas o desactivacion de defensas.", signals.persistence ? "Mecanismo de persistencia" : "Cambio de configuracion de seguridad", "script", "Verifica cada comando y evita ejecutarlo en tu sistema principal.", "alta", "script"));
  }
  if (signals.encodedCommand && signals.longBase64 && signals.download && signals.execution) {
    indicators.push(indicator("script-powershell-download-chain", "critica", "Cadena PowerShell codificada con descarga y ejecucion", "La correlacion combina comando codificado, carga remota y ejecucion. Es mas fuerte que cada senal aislada.", "PowerShell + EncodedCommand + URL/descarga + ejecucion", "script", "No ejecutes este script en tu equipo principal.", "alta", "script"));
  }
  if (signals.lolbinRemote) {
    indicators.push(indicator("script-lolbin-remote", "alta", "Uso remoto de binarios del sistema", "Se detecto certutil, mshta, regsvr32 o rundll32 con contexto remoto o de decodificacion.", "LOLBIN con URL o decodificacion", "script", "Tratalo como sospechoso salvo que conozcas exactamente su finalidad.", "alta", "script"));
  }

  if (!signals.encodedCommand) checks.push({ id: "script-no-encoded-command", label: "No encontramos PowerShell codificado" });
  if (!signals.download || !signals.execution) checks.push({ id: "script-no-download-execute", label: "No encontramos descarga y ejecucion combinadas" });
  if (!signals.persistence && !signals.securityChange) checks.push({ id: "script-no-persistence", label: "No detectamos persistencia ni cambios de seguridad" });

  return { indicators, checks, signals, details: { scriptBytesInspected: Math.min(bytes.length, MAX_TEXT_BYTES), scriptUrls: signals.urlCount, minifiedLike } };
}
