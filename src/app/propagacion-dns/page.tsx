import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnsPropagation } from "@/components/tools/DnsPropagation";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Propagación DNS - Compara resolutores públicos",
  description:
    "Comprueba si un cambio DNS se ha propagado comparando la respuesta de varios resolutores públicos (Cloudflare, Google, Quad9), con porcentaje de coincidencia.",
  path: "/propagacion-dns",
});

const faqs = [
  {
    q: "¿Qué significa propagación DNS?",
    a: "Es el periodo en el que resolutores y cachés empiezan a devolver la nueva respuesta después de cambiar registros DNS o nameservers.",
  },
  {
    q: "¿Esta prueba consulta desde muchos países?",
    a: "No. Compara resolutores públicos anycast como Cloudflare, Google y Quad9. Una diferencia sugiere caché o propagación incompleta, pero no representa una medición país por país.",
  },
  {
    q: "¿Cuánto tarda un cambio DNS?",
    a: "Depende del TTL anterior, del tipo de cambio y de los resolutores. Puede verse en minutos o tardar varias horas; cambios de nameservers suelen requerir más paciencia.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Propagación DNS", path: "/propagacion-dns" }]}>
      <WebApplicationJsonLd
        name="Propagación DNS - IPLibre"
        description="Compara la respuesta DNS entre resolutores públicos."
        path="/propagacion-dns"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Propagación DNS"
        description="Compara la respuesta de un dominio entre varios resolutores públicos para estimar si un cambio ya se ha propagado."
      />
      <DnsPropagation />

      <section className="prose mt-12 max-w-none">
        <h2>Cuándo usar esta herramienta</h2>
        <p>
          Úsala después de cambiar registros A, AAAA, MX, TXT, CNAME o nameservers para comprobar si
          resolutores públicos devuelven la misma respuesta. Es especialmente útil al migrar hosting,
          configurar correo, activar verificaciones TXT o cambiar proveedores DNS.
        </p>
        <h2>Cómo leer una discrepancia</h2>
        <p>
          Si Cloudflare, Google y Quad9 no coinciden, puede haber caché con TTL antiguo, respuestas
          distintas por geolocalización DNS, errores en la zona o cambios aplicados solo en algunos
          nameservers autoritativos. Confirma el registro exacto con DNS Lookup antes de asumir que
          existe una caída.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/dns-lookup", label: "DNS Lookup", description: "Consulta el registro exacto" },
          { href: "/dnssec-checker", label: "DNSSEC Checker", description: "Revisa firmas y DS/DNSKEY" },
          { href: "/whois", label: "WHOIS / RDAP", description: "Comprueba nameservers del dominio" },
        ]}
      />
    </ToolPage>
  );
}
