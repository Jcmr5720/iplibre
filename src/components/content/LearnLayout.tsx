import * as React from "react";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { RelatedLinks, type RelatedLink } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { ArticleJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import type { FaqItem } from "@/lib/content";

/**
 * Plantilla para las páginas informativas ("Aprender"). Unifica encabezado,
 * cuerpo en prosa, FAQ opcional, enlaces internos y datos estructurados
 * (Article + FAQPage), manteniendo la jerarquía H1/H2/H3 correcta.
 */
export function LearnLayout({
  title,
  breadcrumbLabel,
  path,
  intro,
  children,
  faqs,
  related,
}: {
  title: string;
  breadcrumbLabel: string;
  path: string;
  intro: string;
  children: React.ReactNode;
  faqs?: FaqItem[];
  related: RelatedLink[];
}) {
  return (
    <ToolPage breadcrumbs={[{ name: breadcrumbLabel, path }]}>
      <ArticleJsonLd headline={title} description={intro} path={path} />
      {faqs && faqs.length > 0 && (
        <FaqJsonLd items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
      )}
      <PageHeader eyebrow="Aprender" title={title} description={intro} />
      <article className="prose">{children}</article>

      {faqs && faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <Faq items={faqs} />
        </section>
      )}

      <RelatedLinks links={related} />
    </ToolPage>
  );
}
