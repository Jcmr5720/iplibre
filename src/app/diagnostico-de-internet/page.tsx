import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { Diagnostics } from "@/components/tools/Diagnostics";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Diagnóstico de Internet — Chequeo integral de tu conexión",
  description:
    "Comprueba el estado de tu conexión: IP pública, IPv4/IPv6, resolución DNS, acceso HTTPS, latencia y jitter. Con recomendaciones claras.",
  path: "/diagnostico-de-internet",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Diagnóstico de Internet", path: "/diagnostico-de-internet" }]}>
      <WebApplicationJsonLd
        name="Diagnóstico de Internet — IPLibre"
        description="Chequeo integral del estado de tu conexión."
        path="/diagnostico-de-internet"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Diagnóstico de Internet"
        description="Un chequeo integral que reúne el estado de tu conexión en una sola pantalla, distinguiendo cada capa: navegador, HTTPS, DNS y latencia."
      />
      <Diagnostics />
    </ToolPage>
  );
}
