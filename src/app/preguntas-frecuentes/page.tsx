import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { Faq } from "@/components/content/Faq";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { faqItems } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Preguntas frecuentes sobre IP, velocidad y DNS",
  description:
    "Resolvemos las dudas más habituales sobre direcciones IP, geolocalización, test de velocidad, latencia, jitter, DNS, WHOIS/RDAP y ASN.",
  path: "/preguntas-frecuentes",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Preguntas frecuentes", path: "/preguntas-frecuentes" }]}>
      <FaqJsonLd items={faqItems} />
      <PageHeader
        title="Preguntas frecuentes"
        description="Todo lo que conviene saber para interpretar bien los resultados de IPLibre."
      />
      <div className="max-w-3xl">
        <Faq items={faqItems} />
      </div>
    </ToolPage>
  );
}
