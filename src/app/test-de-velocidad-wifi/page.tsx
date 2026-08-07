import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SpeedTest } from "@/components/tools/SpeedTest";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Test de velocidad Wi-Fi — Mide tu conexión inalámbrica",
  description:
    "Mide la velocidad real de tu Wi-Fi: descarga, subida, latencia y jitter. Aprende a distinguir un problema de Wi-Fi de uno de tu proveedor y a mejorar la señal.",
  path: "/test-de-velocidad-wifi",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Test de velocidad Wi-Fi", path: "/test-de-velocidad-wifi" }]}>
      <WebApplicationJsonLd
        name="Test de velocidad Wi-Fi — IPLibre"
        description="Mide la velocidad de tu red Wi-Fi con el mismo motor de medición real."
        path="/test-de-velocidad-wifi"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Test de velocidad Wi-Fi"
        description="El mismo motor de medición real, pensado para diagnosticar tu red inalámbrica. Compara los resultados junto al router y en la habitación donde notas problemas."
      />
      <SpeedTest />

      <article className="prose mt-12">
        <h2>Cómo hacer un buen test de Wi-Fi</h2>
        <p>
          La velocidad que ves por Wi-Fi casi nunca coincide con la que contrataste: la señal
          inalámbrica pierde rendimiento con la distancia, las paredes y las interferencias. Para
          saber si el problema es tu Wi-Fi o tu proveedor, haz varias pruebas:
        </p>
        <ul>
          <li>
            <strong>Junto al router:</strong> mide a un par de metros, sin obstáculos. Es el
            techo real de tu Wi-Fi.
          </li>
          <li>
            <strong>En la zona problemática:</strong> repite el test donde notas cortes. Si baja
            mucho, es cobertura Wi-Fi, no tu conexión.
          </li>
          <li>
            <strong>Con cable, si puedes:</strong> una prueba por cable Ethernet muestra lo que
            realmente entrega tu proveedor, sin el límite del inalámbrico.
          </li>
        </ul>
        <h2>Consejos para mejorar tu Wi-Fi</h2>
        <ul>
          <li>Usa la banda de 5 GHz para dispositivos cercanos; la de 2,4 GHz llega más lejos pero es más lenta.</li>
          <li>Coloca el router en alto, centrado y lejos de microondas y otros aparatos.</li>
          <li>Si tu casa es grande, valora un sistema Wi-Fi en malla (mesh) o repetidores.</li>
          <li>Un <strong>jitter</strong> alto o <strong>ping</strong> inestable por Wi-Fi suele deberse a saturación del canal o interferencias.</li>
        </ul>
      </article>

      <RelatedLinks
        links={[
          { href: "/medir-velocidad-internet", label: "Medir velocidad de Internet", description: "Test general de tu conexión" },
          { href: "/que-es-el-ping", label: "¿Qué es el ping?", description: "La latencia, explicada" },
          { href: "/que-es-el-jitter", label: "¿Qué es el jitter?", description: "La estabilidad de tu red" },
          { href: "/diagnostico-de-internet", label: "Diagnóstico de Internet", description: "Chequeo integral" },
        ]}
      />
    </ToolPage>
  );
}
