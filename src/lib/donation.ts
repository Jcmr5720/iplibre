// Configuración compartida (cliente + servidor) del sistema de donaciones.
// Flujo stateless: no se persiste nada; el registro vive en el panel de Mercado Pago.

export const DONATION_MIN_AMOUNT = 2000;
export const DONATION_MAX_AMOUNT = 50_000_000;
export const DONATION_DEFAULT_AMOUNT = 20000;
export const DONATION_CURRENCY = "COP";

export type DonationSuggestion = {
  value: number;
  badge: string;
  icon: "coffee" | "sparkles" | "rocket";
};

export const DONATION_SUGGESTED_AMOUNTS: readonly DonationSuggestion[] = [
  { value: 5000, badge: "Café", icon: "coffee" },
  { value: 20000, badge: "Popular", icon: "sparkles" },
  { value: 50000, badge: "Generoso", icon: "rocket" },
] as const;

export const donationAmountFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
});

export function formatDonationAmount(value: number): string {
  return donationAmountFormatter.format(value);
}

export type DonationAmountResult =
  | { valid: true; amount: number }
  | { valid: false; error: string };

/**
 * Valida y normaliza un monto de donación en COP.
 * Reutilizado por el formulario (cliente) y por la API route (servidor autoritativo).
 */
export function sanitizeDonationAmount(value: unknown): DonationAmountResult {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^\d]/g, ""))
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { valid: false, error: "Ingresa un monto válido en pesos colombianos." };
  }

  const amount = Math.round(numeric);

  if (amount < DONATION_MIN_AMOUNT) {
    return {
      valid: false,
      error: `El monto mínimo es COL $${donationAmountFormatter.format(DONATION_MIN_AMOUNT)}.`,
    };
  }

  if (amount > DONATION_MAX_AMOUNT) {
    return {
      valid: false,
      error: `El monto máximo es COL $${donationAmountFormatter.format(DONATION_MAX_AMOUNT)}.`,
    };
  }

  return { valid: true, amount };
}
