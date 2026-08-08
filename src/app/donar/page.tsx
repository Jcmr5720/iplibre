import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DonationForm } from "@/components/donation/DonationForm";

export const metadata: Metadata = {
  title: "Aportes voluntarios",
  description:
    "IPLibre es gratis. Apóyanos con un aporte voluntario único para mantener las herramientas de diagnóstico de Internet en línea.",
  alternates: { canonical: "/donar" },
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const parsedEstado = estado === "failure" || estado === "pending" ? estado : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" aria-label="Inicio" className="hover:text-foreground">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>Donar</span>
      </nav>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[1fr_minmax(360px,420px)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Aporte voluntario
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Apoya el mantenimiento de IPLibre
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Tu aporte ayuda a pagar servidores y desarrollo sin convertir IPLibre en una plataforma
            con registro obligatorio ni límites artificiales.
          </p>
          <div className="mt-8 max-w-xl border-y border-border py-5 text-sm leading-7 text-muted-foreground">
            <p>
              El aporte es único y voluntario. No compra una cuenta, no da prioridad, no crea
              suscripción y no ofrece deducción tributaria.
            </p>
            <p className="mt-3">
              Mercado Pago procesa el cobro. IPLibre no recibe los datos completos de tu tarjeta;
              puede recibir confirmaciones operativas como estado, monto y referencia.
            </p>
            <p className="mt-3">
              Si pagaste dos veces o por error, escríbenos desde{" "}
              <Link className="font-semibold text-primary hover:text-accent" href="/contacto">
                Contacto
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-border bg-card p-6 sm:p-7">
          <Logo />
          <h2 className="mt-4 text-xl font-semibold">Monto del aporte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Indica el valor en pesos colombianos. Verás el monto antes de abrir Mercado Pago.
          </p>
          <div className="mt-6">
            <DonationForm estado={parsedEstado} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Al continuar aceptas los{" "}
            <Link className="font-semibold text-primary hover:text-accent" href="/terminos">
              Términos de uso
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
