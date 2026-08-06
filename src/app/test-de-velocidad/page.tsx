import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SpeedTest } from "@/components/tools/SpeedTest";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Test de velocidad de Internet — Descarga, subida, ping y jitter",
  description:
    "Mide la velocidad real de tu conexión: descarga, subida, latencia y jitter. Prueba en el navegador con la red de medición de Cloudflare. Gratis y sin registro.",
  path: "/test-de-velocidad",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Test de velocidad", path: "/test-de-velocidad" }]}>
      <WebApplicationJsonLd
        name="Test de velocidad — IPLibre"
        description="Mide descarga, subida, latencia y jitter de tu conexión."
        path="/test-de-velocidad"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Test de velocidad de Internet"
        description="Medición real en tu navegador. Calienta la conexión, toma varias muestras y descarta valores anómalos para darte un resultado estable."
      />
      <SpeedTest />
    </ToolPage>
  );
}
