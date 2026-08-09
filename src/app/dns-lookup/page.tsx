import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnsLookup } from "@/components/tools/DnsLookup";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "DNS Lookup - Consulta registros A, AAAA, MX, TXT y más",
  description:
    "Consulta registros DNS de cualquier dominio (A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, CAA, DS, DNSKEY) vía DNS-over-HTTPS. Exporta a JSON y CSV.",
  path: "/dns-lookup",
});

const faqs = [
  {
    q: "¿Qué registros DNS puedo consultar?",
    a: "Puedes consultar registros A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, CAA, DS y DNSKEY. Cada tipo responde a una parte distinta de la configuración del dominio.",
  },
  {
    q: "¿Por qué un cambio DNS no aparece todavía?",
    a: "Puede deberse al TTL, a cachés de resolutores o a que el cambio todavía no llegó a todos los servidores autoritativos. En ese caso conviene comparar con Propagación DNS.",
  },
  {
    q: "¿DNS Lookup reemplaza a WHOIS?",
    a: "No. DNS Lookup muestra registros técnicos publicados en DNS. WHOIS/RDAP muestra datos de registro del dominio, IP o ASN.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "DNS Lookup", path: "/dns-lookup" }]}>
      <WebApplicationJsonLd
        name="DNS Lookup - IPLibre"
        description="Consulta registros DNS de un dominio."
        path="/dns-lookup"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="DNS Lookup"
        description="Consulta los registros DNS de un dominio mediante DNS-over-HTTPS. Elige un tipo concreto o pide todos los registros compatibles a la vez."
      />
      <DnsLookup />

      <section className="prose mt-12 max-w-none">
        <h2>Cuándo usar DNS Lookup</h2>
        <p>
          Usa esta herramienta para revisar si un dominio apunta a la IP correcta, comprobar registros
          de correo MX/TXT, validar CAA, inspeccionar claves DNSSEC o comparar la configuración que
          ve un resolutor público mediante DNS-over-HTTPS.
        </p>
        <h2>Cómo interpretar los resultados</h2>
        <p>
          El estado NOERROR indica que la consulta fue válida, aunque puede no traer respuestas para
          todos los tipos. NXDOMAIN suele indicar que el nombre no existe. TTL muestra cuánto tiempo
          puede quedar cacheada una respuesta antes de volver a consultarse.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara respuestas entre resolutores" },
          { href: "/dnssec-checker", label: "DNSSEC Checker", description: "Valida la cadena DNSSEC" },
          { href: "/whois", label: "WHOIS / RDAP", description: "Consulta datos de registro" },
        ]}
      />
    </ToolPage>
  );
}
