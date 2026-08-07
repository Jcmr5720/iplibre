/**
 * Umbrales centralizados para la evaluación de certificados SSL/TLS.
 * Cambiar estos valores ajusta el criterio en toda la herramienta.
 */

export const SSL_THRESHOLDS = {
  /** Por encima de estos días restantes se considera correcto. */
  okDays: 30,
  /** Entre okDays y warningDays: advertencia. */
  warningDays: 7,
} as const;

export type SslState = "secure" | "expiringSoon" | "critical" | "expired" | "invalid" | "notYetValid";

export function classifySsl(params: {
  valid: boolean; // cadena confiable + hostname válido
  hostnameValid: boolean;
  expired: boolean;
  notYetValid: boolean;
  daysRemaining: number;
}): { state: SslState; label: string } {
  if (params.notYetValid) return { state: "notYetValid", label: "Aún no válido" };
  if (params.expired) return { state: "expired", label: "Expirado" };
  if (!params.hostnameValid) return { state: "invalid", label: "No coincide el dominio" };
  if (!params.valid) return { state: "invalid", label: "No válido" };
  if (params.daysRemaining <= SSL_THRESHOLDS.warningDays)
    return { state: "critical", label: "Vence en muy pocos días" };
  if (params.daysRemaining <= SSL_THRESHOLDS.okDays)
    return { state: "expiringSoon", label: "Próximo a vencer" };
  return { state: "secure", label: "Seguro" };
}

/** Días completos entre ahora y una fecha futura (negativo si ya pasó). */
export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.floor(ms / 86_400_000);
}
