import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { GeoLookup } from "@/components/tools/GeoLookup";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Geolocalizar IP — Ubicación aproximada de una dirección IP",
  description:
    "Consulta la ubicación aproximada de cualquier IPv4 o IPv6: país, región, ciudad, zona horaria, proveedor y ASN. Con aviso de precisión.",
  path: "/geolocalizar-ip",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Geolocalizar IP", path: "/geolocalizar-ip" }]}>
      <WebApplicationJsonLd
        name="Geolocalizar IP — IPLibre"
        description="Ubicación aproximada de una dirección IP."
        path="/geolocalizar-ip"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Geolocalizar una IP"
        description="Introduce una dirección IPv4 o IPv6 para ver su ubicación aproximada y los datos de red asociados. La geolocalización por IP nunca es exacta."
      />
      <GeoLookup />
    </ToolPage>
  );
}
