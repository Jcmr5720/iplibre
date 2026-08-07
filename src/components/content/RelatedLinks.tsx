import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type RelatedLink = { href: string; label: string; description?: string };

/**
 * Bloque de enlaces internos relacionados. Refuerza la arquitectura SEO
 * conectando herramientas con sus conceptos (y viceversa) de forma útil para
 * el usuario, sin saturar.
 */
export function RelatedLinks({
  title = "Sigue explorando",
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{l.label}</span>
              {l.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{l.description}</span>
              )}
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
