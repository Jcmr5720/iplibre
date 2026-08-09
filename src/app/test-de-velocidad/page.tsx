import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SpeedTest } from "@/components/tools/SpeedTest";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Test de velocidad de Internet: descarga, subida, ping y jitter",
  description:
    "Mide la velocidad de Internet en tu navegador: descarga, subida, ping HTTPS y jitter. Resultado claro para WiFi, fibra, móvil o VPN.",
  path: "/test-de-velocidad",
});

const faqs = [
  {
    q: "¿Qué mide este test de velocidad?",
    a: "Mide descarga, subida, latencia HTTPS y jitter desde el navegador. No usa ping ICMP, porque los navegadores no permiten enviar ese tipo de paquetes.",
  },
  {
    q: "¿Por qué cambia el resultado?",
    a: "La velocidad puede variar por Wi-Fi, distancia al router, dispositivo, navegador, servidor de prueba, VPN, hora del día y congestión de la red.",
  },
  {
    q: "¿Debo cerrar otras aplicaciones?",
    a: "Si quieres una medición más estable, cierra descargas, videollamadas y otros dispositivos consumiendo ancho de banda. Para comparar, repite la prueba varias veces.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Test de velocidad", path: "/test-de-velocidad" }]}>
      <WebApplicationJsonLd
        name="Test de velocidad - IPLibre"
        description="Mide descarga, subida, latencia y jitter de tu conexión."
        path="/test-de-velocidad"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta insignia"
        title="Test de velocidad de Internet"
        description="Mide tu velocidad de descarga, subida, ping y jitter con una prueba clara y orientativa desde el navegador."
      />
      <SpeedTest />

      <RelatedLinks
        title="Comprueba también"
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Ver IP pública, proveedor y ubicación aproximada" },
          { href: "/que-es-el-ping", label: "Qué es el ping", description: "Entiende la latencia de tu conexión" },
          { href: "/que-es-el-jitter", label: "Qué es el jitter", description: "Aprende qué significa la estabilidad" },
        ]}
      />

      <section className="prose mt-12 max-w-none">
        <h2>Como interpretar la velocidad de Internet</h2>
        <p>
          La descarga indica qué tan rápido recibes datos, por ejemplo al ver video o abrir páginas.
          La subida importa para videollamadas, copias en la nube y envío de archivos. El ping o
          latencia mide el tiempo de respuesta; el jitter muestra cuánto varía esa latencia.
        </p>
        <p>
          Un test de velocidad en navegador es útil para diagnosticar tu conexión real, pero no debe
          presentar una precisión falsa. El resultado depende del Wi-Fi, router, equipo, servidor de
          medición, proveedor, VPN, hora y congestión temporal.
        </p>
        <h2>Consejos para medir mejor</h2>
        <ul>
          <li>Prueba cerca del router o con cable si quieres aislar problemas de Wi-Fi.</li>
          <li>Repite la medición en distintos horarios antes de sacar conclusiones.</li>
          <li>Compara el resultado con la velocidad contratada y con otros dispositivos.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>
    </ToolPage>
  );
}
