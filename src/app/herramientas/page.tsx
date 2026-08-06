import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Herramientas de red — IP, velocidad, DNS, WHOIS y más",
  description:
    "Todas las herramientas de IPLibre para diagnosticar tu conexión: mi IP, test de velocidad, diagnóstico, geolocalización, WHOIS/RDAP, DNS, propagación, ASN y reverse DNS.",
  path: "/herramientas",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Herramientas", path: "/herramientas" }]}>
      <PageHeader
        eyebrow="Catálogo"
        title="Todas las herramientas"
        description="Nueve utilidades de diagnóstico de red, cada una con consultas reales a fuentes públicas y resultados que puedes verificar."
      />
      <ToolsGrid />
    </ToolPage>
  );
}
