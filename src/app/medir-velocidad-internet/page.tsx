import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SpeedTest } from "@/components/tools/SpeedTest";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Medir la velocidad de Internet — Test de descarga y subida",
  description:
    "Mide la velocidad de tu Internet en el navegador: descarga, subida, latencia y jitter reales. Sin apps ni registro. Pulsa iniciar y obtén tus Mbps en segundos.",
  path: "/medir-velocidad-internet",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Medir velocidad de Internet", path: "/medir-velocidad-internet" }]}>
      <WebApplicationJsonLd
        name="Medir velocidad de Internet — IPLibre"
        description="Mide la velocidad de descarga, subida, latencia y jitter de tu conexión."
        path="/medir-velocidad-internet"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Medir la velocidad de tu Internet"
        description="Pulsa iniciar para medir tu conexión en tiempo real. Calentamos la línea, tomamos varias muestras y descartamos valores anómalos para darte descarga, subida, latencia y jitter fiables."
      />
      <SpeedTest />

      <RelatedLinks
        links={[
          { href: "/test-de-velocidad-wifi", label: "Test de velocidad Wi-Fi", description: "Mide y mejora tu conexión inalámbrica" },
          { href: "/que-es-el-ping", label: "¿Qué es el ping?", description: "La latencia, explicada" },
          { href: "/que-es-el-jitter", label: "¿Qué es el jitter?", description: "Por qué tu conexión se corta" },
          { href: "/diagnostico-de-internet", label: "Diagnóstico de Internet", description: "Chequeo integral de tu conexión" },
          { href: "/mi-ip", label: "Mi IP", description: "Tu dirección y proveedor" },
        ]}
      />
    </ToolPage>
  );
}
