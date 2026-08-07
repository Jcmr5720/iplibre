import { ArrowUpRight, FileText } from "lucide-react";
import { Container } from "@/components/layout/PageShell";
import { relatedApps } from "@/lib/config";

/**
 * Sección "Más herramientas gratuitas": presenta las aplicaciones hermanas del
 * ecosistema (por ahora PDFLibre) como productos independientes, sin banners
 * publicitarios. Escalable vía `relatedApps` en la configuración.
 */
export function RelatedApps() {
  if (relatedApps.length === 0) return null;
  return (
    <section className="border-t border-border">
      <Container className="py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Más herramientas gratuitas
          </h2>
          <p className="mt-2 text-muted-foreground">
            IPLibre forma parte de un ecosistema de utilidades libres y sin registro. Estas son otras
            aplicaciones que quizá te resulten útiles.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatedApps.map((app) => (
            <a
              key={app.href}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="absolute right-4 top-4 text-muted-foreground transition-colors group-hover:text-primary">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{app.name}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{app.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {app.cta}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
              <span className="sr-only">(se abre en una nueva pestaña)</span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
