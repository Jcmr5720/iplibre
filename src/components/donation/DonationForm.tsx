"use client";

import { useState } from "react";
import {
  ArrowRight,
  CircleAlert,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  DONATION_DEFAULT_AMOUNT,
  DONATION_MIN_AMOUNT,
  DONATION_SUGGESTED_AMOUNTS,
  formatDonationAmount,
  sanitizeDonationAmount,
} from "@/lib/donation";

export function DonationForm({ estado }: { estado?: "failure" | "pending" }) {
  const [amount, setAmount] = useState(DONATION_DEFAULT_AMOUNT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validation = sanitizeDonationAmount(amount);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/donations/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: validation.amount }),
      });
      const data = (await response.json().catch(() => null)) as
        | { init_point?: string; error?: string }
        | null;

      if (!response.ok || !data?.init_point) {
        setError(data?.error ?? "No pudimos iniciar el pago. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      // Redirección de nivel superior al checkout de Mercado Pago.
      window.location.href = data.init_point;
    } catch {
      setError("No pudimos conectar con el servicio de pagos. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {estado === "failure" && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          El pago no se completó. Puedes intentarlo de nuevo cuando quieras.
        </p>
      )}
      {estado === "pending" && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Tu pago está pendiente de confirmación.
        </p>
      )}

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Montos sugeridos
        </span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {DONATION_SUGGESTED_AMOUNTS.map((item) => {
            const selected = amount === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setAmount(item.value);
                  setError(null);
                }}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <span className="text-sm font-bold text-foreground">
                  ${formatDonationAmount(item.value)}
                </span>
                <span className="text-[11px] text-muted-foreground">{item.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="donation-custom-amount" className="text-sm font-medium text-foreground">
          O ingresa un monto personalizado
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-border bg-card px-3 focus-within:border-primary">
          <span className="text-muted-foreground">$</span>
          <input
            id="donation-custom-amount"
            name="amount"
            type="text"
            inputMode="numeric"
            placeholder="20000"
            value={amount > 0 ? String(amount) : ""}
            onChange={(event) => {
              const numeric = Number(event.target.value.replace(/[^\d]/g, ""));
              setAmount(Number.isFinite(numeric) ? numeric : 0);
              setError(null);
            }}
            className="w-full bg-transparent px-2 py-3 text-foreground outline-none"
          />
          <span className="text-xs text-muted-foreground">COP</span>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="h-3.5 w-3.5" />
        Monto mínimo:{" "}
        <strong className="font-semibold text-foreground">
          COL ${formatDonationAmount(DONATION_MIN_AMOUNT)}
        </strong>
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || amount < DONATION_MIN_AMOUNT}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirigiendo a Mercado Pago…
          </>
        ) : (
          <>
            Continuar al pago
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Aporte único · Pago seguro con Mercado Pago
      </p>
    </form>
  );
}
