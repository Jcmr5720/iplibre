import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { tools } from "@/lib/config";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <p className="brand-gradient-text text-7xl font-black">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        La dirección que buscas no existe o se ha movido. Prueba con una de nuestras herramientas o
        vuelve al inicio.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">
          <Home className="h-4 w-4" /> Ir al inicio
        </ButtonLink>
        <ButtonLink href="/herramientas" variant="outline">
          <Search className="h-4 w-4" /> Ver herramientas
        </ButtonLink>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {tools.slice(0, 6).map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </Container>
  );
}
