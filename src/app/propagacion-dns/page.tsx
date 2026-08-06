import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnsPropagation } from "@/components/tools/DnsPropagation";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Propagación DNS — Compara resolutores públicos",
  description:
    "Comprueba si un cambio DNS se ha propagado comparando la respuesta de varios resolutores públicos (Cloudflare, Google, Quad9), con porcentaje de coincidencia.",
  path: "/propagacion-dns",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Propagación DNS", path: "/propagacion-dns" }]}>
      <WebApplicationJsonLd
        name="Propagación DNS — IPLibre"
        description="Compara la respuesta DNS entre resolutores públicos."
        path="/propagacion-dns"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Propagación DNS"
        description="Compara la respuesta de un dominio entre varios resolutores públicos para estimar si un cambio ya se ha propagado."
      />
      <DnsPropagation />
    </ToolPage>
  );
}
