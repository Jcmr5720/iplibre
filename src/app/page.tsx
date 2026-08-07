import Link from "next/link";
import { Gauge, Globe2, Lock, ShieldCheck, Zap } from "lucide-react";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { HeroIp } from "@/components/home/HeroIp";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { RelatedApps } from "@/components/home/RelatedApps";
import { Faq } from "@/components/content/Faq";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { concepts, faqItems } from "@/lib/content";
import { siteConfig } from "@/lib/config";

export default function Home() {
  const homeFaqs = faqItems.slice(0, 6);
  return (
    <>
      <FaqJsonLd items={homeFaqs.map((f) => ({ q: f.q, a: f.a }))} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-backdrop absolute inset-0 -z-10" aria-hidden />
        <Container className="py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" /> Diagnóstico de Internet gratuito
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Descubre tu IP y mide la velocidad de tu{" "}
                <span className="brand-gradient-text">Internet</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                {siteConfig.name} reúne todo lo que necesitas para diagnosticar tu conexión: IP,
                velocidad, latencia, DNS, WHOIS/RDAP, ASN y geolocalización. Datos reales, sin
                registro y respetando tu privacidad.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/test-de-velocidad" size="lg">
                  <Gauge className="h-5 w-5" /> Iniciar test de velocidad
                </ButtonLink>
                <ButtonLink href="/mi-ip" size="lg" variant="outline">
                  <Globe2 className="h-5 w-5" /> Ver mi IP
                </ButtonLink>
              </div>
            </div>

            <div className="lg:pl-6">
              <HeroIp />
              <ul className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
                <li className="rounded-lg border border-border bg-card/60 p-3">
                  <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-primary" /> Sin rastreo invasivo
                </li>
                <li className="rounded-lg border border-border bg-card/60 p-3">
                  <Lock className="mx-auto mb-1 h-4 w-4 text-primary" /> IP no almacenada
                </li>
                <li className="rounded-lg border border-border bg-card/60 p-3">
                  <Zap className="mx-auto mb-1 h-4 w-4 text-primary" /> Resultados reales
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Herramientas */}
      <Container className="py-14">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Todas las herramientas</h2>
            <p className="mt-2 text-muted-foreground">
              Nueve utilidades de red, cada una con consultas reales y resultados verificables.
            </p>
          </div>
          <Link href="/herramientas" className="text-sm font-medium text-primary hover:underline">
            Ver la lista completa →
          </Link>
        </div>
        <ToolsGrid />
      </Container>

      {/* Conceptos */}
      <section className="border-y border-border bg-card/40">
        <Container className="py-14">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Conceptos clave, explicados sencillo
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Entiende qué significan velocidad, ping, jitter, DNS, ASN y WHOIS sin tecnicismos
            innecesarios.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((c) => (
              <div key={c.term} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-primary">{c.term}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.definition}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Privacidad */}
      <Container className="py-14">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShieldCheck className="h-6 w-6 text-primary" /> Privacidad por diseño
            </h2>
            <p className="mt-3 text-muted-foreground">
              No vendemos ni compartimos tus datos. No usamos cookies publicitarias ni huellas
              digitales invasivas. No registramos deliberadamente IP completas en analíticas y el
              historial de tus pruebas se queda en tu navegador.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/privacidad" className="text-sm font-medium text-primary hover:underline">
                Política de privacidad →
              </Link>
              <Link href="/cookies" className="text-sm font-medium text-primary hover:underline">
                Política de cookies →
              </Link>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              "Tu IP no se almacena de forma permanente.",
              "El historial de velocidad vive solo en tu dispositivo.",
              "Sin cookies de publicidad en esta versión.",
              "Consultas validadas y con límites contra el abuso.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <Container className="py-14">
          <div className="mb-8 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Preguntas frecuentes</h2>
            <Link
              href="/preguntas-frecuentes"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <Faq items={homeFaqs} />
          <p className="mt-6 rounded-lg border border-warning/30 bg-warning-bg/50 p-4 text-sm text-foreground/80">
            <strong className="text-foreground">Aviso:</strong> la geolocalización por IP es
            aproximada y los resultados de velocidad son orientativos. No sustituyen una medición
            certificada de tu proveedor.
          </p>
        </Container>
      </section>

      {/* Otras aplicaciones */}
      <RelatedApps />
    </>
  );
}
