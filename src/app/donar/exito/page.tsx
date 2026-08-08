import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Aporte recibido",
  description: "Tu aporte ayuda a mantener IPLibre gratuito.",
  alternates: { canonical: "/donar/exito" },
  robots: { index: false },
};

export default function DonationSuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md border-l-2 border-success py-2 pl-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-5 w-5" /> Pago recibido
        </p>
        <h1 className="mt-4 text-2xl font-semibold">Gracias por tu aporte.</h1>
        <p className="mt-3 text-muted-foreground">
          Mercado Pago enviará el comprobante a tu correo.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-accent"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
