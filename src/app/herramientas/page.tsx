import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ToolsByCategory } from "@/components/home/ToolsGrid";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Herramientas de red — IP, velocidad, DNS, WHOIS, SSL y más",
  description:
    "Todas las herramientas de IPLibre para diagnosticar tu conexión y sitios web: mi IP, test de velocidad, IPv6, WebRTC, geolocalización, WHOIS/RDAP, DNS, DNSSEC, listas negras, SSL, headers, redirecciones, SPF/DKIM/DMARC y generador de contraseñas.",
  path: "/herramientas",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Herramientas", path: "/herramientas" }]}>
      <PageHeader
        eyebrow="Catálogo"
        title="Todas las herramientas"
        description={`${tools.length} utilidades de diagnóstico de red y sitios web, cada una con consultas reales a fuentes públicas y resultados que puedes verificar.`}
      />
      <ToolsByCategory />
    </ToolPage>
  );
}
