import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ToolsByCategory } from "@/components/home/ToolsGrid";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Herramientas online — IP, velocidad, archivos, DNS y seguridad",
  description:
    "Todas las herramientas de IPLibre para consultar tu IP, medir velocidad, analizar archivos localmente y diagnosticar DNS, privacidad, sitios web y seguridad.",
  path: "/herramientas",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Herramientas", path: "/herramientas" }]}>
      <PageHeader
        eyebrow="Catálogo"
        title="Todas las herramientas"
        description={`${tools.length} utilidades de conexión, red, archivos y seguridad. Las herramientas locales procesan los datos en tu dispositivo; las consultas de red usan fuentes públicas verificables.`}
      />
      <ToolsByCategory />
    </ToolPage>
  );
}
