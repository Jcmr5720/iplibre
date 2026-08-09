import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { GeoLookup } from "@/components/tools/GeoLookup";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Geolocalizar IP - Ubicación aproximada de una dirección IP",
  description:
    "Consulta la ubicación aproximada de cualquier IPv4 o IPv6: país, región, ciudad, zona horaria, proveedor y ASN. Con aviso de precisión.",
  path: "/geolocalizar-ip",
});

const faqs = [
  {
    q: "¿La geolocalización por IP es exacta?",
    a: "No. Suele aproximar país, región o ciudad, pero puede apuntar al ISP, a un nodo de red o a la sede del proveedor.",
  },
  {
    q: "¿Por qué una VPN cambia la ubicación?",
    a: "Porque los sitios ven la IP de salida de la VPN. La ubicación corresponde a esa IP pública, no necesariamente a tu ubicación física.",
  },
  {
    q: "¿Puedo geolocalizar una IPv6?",
    a: "Sí, cuando la fuente externa dispone de datos para esa IPv6. La precisión puede variar más que en IPv4 según el proveedor.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Geolocalizar IP", path: "/geolocalizar-ip" }]}>
      <WebApplicationJsonLd
        name="Geolocalizar IP - IPLibre"
        description="Ubicación aproximada de una dirección IP."
        path="/geolocalizar-ip"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Geolocalizar una IP"
        description="Introduce una dirección IPv4 o IPv6 para ver su ubicación aproximada y los datos de red asociados. La geolocalización por IP nunca es exacta."
      />
      <GeoLookup />

      <section className="prose mt-12 max-w-none">
        <h2>Qué datos muestra</h2>
        <p>
          Cuando están disponibles, mostramos país, región, ciudad aproximada, zona horaria,
          proveedor, organización y ASN. Estos datos proceden de fuentes públicas de geolocalización
          IP y pueden cambiar con el tiempo.
        </p>
        <h2>Privacidad y precisión</h2>
        <p>
          Una IP no revela por sí sola una dirección física exacta. Redes móviles, CGNAT, VPN, proxies
          y operadores con infraestructura distribuida pueden hacer que la ubicación sea genérica o
          distinta de la real.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Consulta tu IP pública" },
          { href: "/asn-lookup", label: "ASN Lookup", description: "Red y prefijos de la IP" },
          { href: "/webrtc-leak-test", label: "WebRTC Leak Test", description: "Comprueba exposición de IP" },
        ]}
      />
    </ToolPage>
  );
}
