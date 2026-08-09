import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { AsnLookup } from "@/components/tools/AsnLookup";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "ASN Lookup - Consulta un Sistema Autónomo o IP",
  description:
    "Consulta un ASN o una IP y obtén el nombre, organización, país, registro regional y los prefijos IPv4/IPv6 anunciados en BGP.",
  path: "/asn-lookup",
});

const faqs = [
  {
    q: "¿Qué es un ASN?",
    a: "Un ASN identifica a un Sistema Autónomo: una red o conjunto de redes que anuncia prefijos IP en Internet mediante BGP.",
  },
  {
    q: "¿Para qué sirve consultar el ASN de una IP?",
    a: "Sirve para saber qué operador, proveedor cloud, ISP o red anuncia una IP, y para entender rutas, reputación o propiedad operacional.",
  },
  {
    q: "¿Un ASN identifica al usuario final?",
    a: "No. Normalmente identifica al operador de red, no a una persona. Muchas conexiones residenciales comparten infraestructura, CGNAT o rangos dinámicos.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "ASN Lookup", path: "/asn-lookup" }]}>
      <WebApplicationJsonLd
        name="ASN Lookup - IPLibre"
        description="Consulta ASN, organización y prefijos anunciados."
        path="/asn-lookup"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="ASN Lookup"
        description="Introduce un número de Sistema Autónomo (p. ej. AS15169) o una IP para ver la organización responsable, su registro regional y los prefijos que anuncia."
      />
      <AsnLookup />

      <section className="prose mt-12 max-w-none">
        <h2>Cuándo usar ASN Lookup</h2>
        <p>
          Usa esta herramienta para investigar qué red anuncia una IP, distinguir tráfico residencial
          de cloud/hosting, revisar prefijos IPv4 o IPv6 y entender relaciones básicas entre IP, ISP
          y BGP.
        </p>
        <h2>Cómo interpretar prefijos</h2>
        <p>
          Un prefijo como 203.0.113.0/24 representa un bloque de direcciones anunciado por el ASN. Que
          una IP pertenezca a ese bloque no implica que todas las direcciones tengan el mismo uso o
          reputación.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Ver ASN de tu conexión" },
          { href: "/geolocalizar-ip", label: "Geolocalizar IP", description: "Ubicación aproximada y proveedor" },
          { href: "/blacklist-checker", label: "Blacklist Checker", description: "Reputación de una IP" },
        ]}
      />
    </ToolPage>
  );
}
