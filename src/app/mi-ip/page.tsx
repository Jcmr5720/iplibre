import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { MyIp } from "@/components/tools/MyIp";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mi IP — Cuál es mi dirección IP pública",
  description:
    "Consulta tu dirección IP pública (IPv4 e IPv6), proveedor, ASN y ubicación aproximada. Detección en tiempo real, gratis y sin registro.",
  path: "/mi-ip",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Mi IP", path: "/mi-ip" }]}>
      <WebApplicationJsonLd
        name="Mi IP — IPLibre"
        description="Consulta tu IP pública y datos de conexión."
        path="/mi-ip"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Mi dirección IP"
        description="Esta es la IP pública con la que tu conexión se identifica en Internet, junto con los datos de red que las fuentes públicas asocian a ella."
      />
      <MyIp />
    </ToolPage>
  );
}
