import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { Ipv6Test } from "@/components/tools/Ipv6Test";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Test IPv6: comprobar compatibilidad IPv6 de tu conexión",
  description:
    "Comprueba si tu conexión a Internet puede usar IPv6 correctamente. Detecta conectividad IPv4 e IPv6 reales desde tu navegador, con tu IP pública y tiempos de respuesta.",
  path: "/test-ipv6",
});

const faqs = [
  {
    q: "¿Cómo comprueba el test mi IPv6?",
    a: "Desde tu navegador intentamos conectar a dos servidores: uno solo accesible por IPv4 y otro solo por IPv6. Si la conexión IPv6 tiene éxito, tu conexión soporta IPv6 de forma real, no simulada.",
  },
  {
    q: "Tengo solo IPv4, ¿es un problema?",
    a: "No necesariamente. La mayoría de sitios siguen funcionando con IPv4. IPv6 mejora el rendimiento y resuelve la escasez de direcciones, pero su disponibilidad depende de tu proveedor y tu router.",
  },
  {
    q: "¿Por qué no se muestra mi IPv6?",
    a: "Si tu conexión no tiene ruta IPv6, no existe una dirección IPv6 pública que mostrar. No inventamos una dirección cuando no hay conectividad.",
  },
  {
    q: "¿El test envía mis datos a terceros?",
    a: "Las comprobaciones de conectividad se realizan desde tu navegador contra endpoints públicos específicos por familia. No almacenamos tus direcciones IP de forma permanente.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Test IPv6", path: "/test-ipv6" }]}>
      <WebApplicationJsonLd
        name="Test IPv6 — IPLibre"
        description="Comprueba si tu conexión puede utilizar IPv6 correctamente."
        path="/test-ipv6"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Test IPv6"
        description="Comprueba si tu conexión puede utilizar IPv6 correctamente. Medimos la conectividad real IPv4 e IPv6 desde tu navegador."
      />
      <Ipv6Test />

      <section className="prose mt-12 max-w-none">
        <h2>Qué significan los resultados</h2>
        <p>
          Si tanto IPv4 como IPv6 aparecen como disponibles, tu conexión tiene doble pila (dual
          stack) y usará IPv6 cuando el destino lo permita. Si solo IPv4 está disponible, tu conexión
          funciona con el protocolo clásico. La compatibilidad depende de tu operador y tu router.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Tu dirección IP pública" },
          { href: "/diagnostico-de-internet", label: "Diagnóstico", description: "Chequeo integral de tu red" },
          { href: "/ipv4-vs-ipv6", label: "IPv4 vs IPv6", description: "Diferencias entre protocolos" },
        ]}
      />
    </ToolPage>
  );
}
