import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { MyIp } from "@/components/tools/MyIp";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "¿Cuál es mi IP? — Ver mi dirección IP pública ahora",
  description:
    "Descubre cuál es tu IP pública al instante (IPv4 e IPv6), con botón para copiarla y tus datos de conexión: proveedor, ASN y ubicación aproximada. Gratis y sin registro.",
  path: "/cual-es-mi-ip",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "¿Cuál es mi IP?", path: "/cual-es-mi-ip" }]}>
      <WebApplicationJsonLd
        name="¿Cuál es mi IP? — IPLibre"
        description="Consulta al instante cuál es tu dirección IP pública."
        path="/cual-es-mi-ip"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="¿Cuál es mi IP?"
        description="Esta es la dirección IP pública con la que tu conexión se identifica en Internet. Cópiala con un clic y consulta los datos que las fuentes públicas asocian a ella."
      />
      <MyIp />

      <RelatedLinks
        links={[
          { href: "/que-es-mi-ip", label: "¿Qué es una IP?", description: "Entiende qué es y para qué sirve" },
          { href: "/ipv4-vs-ipv6", label: "IPv4 vs IPv6", description: "Diferencias entre ambos protocolos" },
          { href: "/geolocalizar-ip", label: "Geolocalizar una IP", description: "Ubica cualquier dirección IP" },
          { href: "/asn-lookup", label: "ASN Lookup", description: "El operador detrás de una IP" },
          { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide tu conexión ahora" },
        ]}
      />
    </ToolPage>
  );
}
