import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { WhoisLookup } from "@/components/tools/WhoisLookup";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WHOIS / RDAP - Consulta dominios, IP y ASN",
  description:
    "Consulta datos de registro de dominios, direcciones IP y ASN mediante RDAP, el sucesor estandarizado de WHOIS: registrador, fechas, estados, DNSSEC y contactos públicos.",
  path: "/whois",
});

const faqs = [
  {
    q: "¿Qué diferencia hay entre WHOIS y RDAP?",
    a: "RDAP es el reemplazo moderno de WHOIS: devuelve datos estructurados, usa HTTPS y permite respuestas más consistentes para dominios, IP y ASN.",
  },
  {
    q: "¿Por qué no aparecen datos personales del titular?",
    a: "Muchos registros ocultan o minimizan datos personales por privacidad y normativa. La herramienta muestra solo información pública devuelta por RDAP.",
  },
  {
    q: "¿Puedo consultar una IP o un ASN?",
    a: "Sí. RDAP permite consultar dominios, direcciones IP y sistemas autónomos para conocer registro regional, estado y referencias públicas.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "WHOIS / RDAP", path: "/whois" }]}>
      <WebApplicationJsonLd
        name="WHOIS / RDAP - IPLibre"
        description="Consulta datos de registro de dominios, IP y ASN."
        path="/whois"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="WHOIS / RDAP"
        description="Consulta los datos de registro de un dominio, una IP o un ASN. Usamos RDAP, el protocolo estandarizado y estructurado que sucede a WHOIS."
      />
      <WhoisLookup />

      <section className="prose mt-12 max-w-none">
        <h2>Qué puedes comprobar</h2>
        <p>
          RDAP ayuda a revisar registrador, fechas de alta y expiración, estados del dominio,
          nameservers, delegación DNSSEC y entidades públicas asociadas. En IP y ASN permite ubicar
          el registro regional responsable y los datos administrativos disponibles.
        </p>
        <h2>Limitaciones</h2>
        <p>
          Los datos dependen del registro consultado. La ausencia de un contacto o propietario no
          significa necesariamente que el dominio sea sospechoso: muchos registros aplican privacidad
          por defecto.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/dns-lookup", label: "DNS Lookup", description: "Consulta registros publicados" },
          { href: "/asn-lookup", label: "ASN Lookup", description: "Analiza redes y prefijos BGP" },
          { href: "/ssl-checker", label: "SSL Checker", description: "Revisa el certificado HTTPS" },
        ]}
      />
    </ToolPage>
  );
}
