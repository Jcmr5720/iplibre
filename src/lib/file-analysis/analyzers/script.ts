import { MAX_TEXT_BYTES } from "../constants";
import { indicator } from "../indicator";
import type { Indicator } from "../types";

export function analyzeScript(bytes: Uint8Array): Indicator[] {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const indicators: Indicator[] = [];
  const longBase64 = /[A-Za-z0-9+/]{300,}={0,2}/.test(text);
  const encodedCommand = /(?:powershell|pwsh)[^\r\n]{0,120}(?:-enc(?:odedcommand)?\b)/i.test(text);
  const dynamic = /\b(?:eval|Function)\s*\(|Invoke-Expression|\biex\b/i.test(text);
  const download = /(?:https?:\/\/|Invoke-WebRequest|DownloadString|curl\s|wget\s)/i.test(text);
  const execute = /(?:Start-Process|WScript\.Shell|ShellExecute|child_process|cmd\.exe|powershell(?:\.exe)?|chmod\s+\+x)/i.test(text);
  const persistence = /(?:CurrentVersion\\Run|schtasks|crontab|Startup\\|New-Service)/i.test(text);
  const securityChange = /(?:Set-MpPreference|DisableRealtimeMonitoring|netsh\s+advfirewall|Add-MpPreference)/i.test(text);
  if (longBase64 || (text.length > 2000 && text.replace(/[A-Za-z0-9+/=]/g, "").length / text.length < 0.08)) indicators.push(indicator("script-obfuscation", "media", "Codigo posiblemente ofuscado", "Se detectaron bloques codificados o una distribucion de caracteres poco habitual. Puede ser empaquetado legitimo.", longBase64 ? "Bloque Base64 largo" : "Texto con baja variedad sintactica", "script", "Revisa una version legible del script y confirma su procedencia."));
  if (encodedCommand) indicators.push(indicator("script-encoded-command", "alta", "Comando PowerShell codificado", "Los comandos codificados ocultan lo que se ejecutara y requieren especial precaucion.", "PowerShell con -EncodedCommand", "script", "No ejecutes el script sin decodificar y revisar el comando en un entorno seguro."));
  if (dynamic) indicators.push(indicator("script-dynamic-execution", "media", "Ejecucion dinamica de codigo", "El script contiene mecanismos capaces de interpretar codigo construido durante la ejecucion.", "eval, Function o Invoke-Expression", "script", "Inspecciona el contenido que llegaria a esa llamada antes de ejecutar."));
  if (download && execute) indicators.push(indicator("script-download-execute", "alta", "Descarga combinada con ejecucion", "La combinacion puede obtener contenido remoto y ejecutarlo; es mas relevante que cualquiera de las señales por separado.", "Patrones de red y creacion de procesos", "script", "No ejecutes el archivo hasta validarlo con una solucion antivirus completa."));
  if (persistence || securityChange) indicators.push(indicator("script-persistence", "alta", "Cambios persistentes o de seguridad", "Se encontraron instrucciones relacionadas con arranque automatico, tareas programadas o desactivacion de defensas.", persistence ? "Mecanismo de persistencia" : "Cambio de configuracion de seguridad", "script", "Verifica cada comando y evita ejecutarlo en tu sistema principal."));
  return indicators;
}

