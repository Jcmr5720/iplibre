import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { MyIp } from "@/components/tools/MyIp";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mi IP: cuál es mi dirección IP pública IPv4 o IPv6",
  description:
    "Consulta cuál es tu IP pública, si navegas con IPv4 o IPv6, tu proveedor, ASN y ubicación aproximada. Gratis, rápido y sin registro.",
  path: "/mi-ip",
});

const faqs = [
  {
    q: "¿Cuál es mi IP pública?",
    a: "Es la dirección que ven los sitios y servicios de Internet cuando tu conexión se comunica con ellos. Puede ser IPv4, IPv6 o ambas según tu proveedor y red.",
  },
  {
    q: "¿La ubicación por IP es exacta?",
    a: "No. La geolocalización por IP es aproximada y suele apuntar al proveedor, ciudad o nodo de red, no a una dirección física precisa.",
  },
  {
    q: "¿Por qué veo IPv4 o IPv6?",
    a: "IPv4 es el formato clásico de direcciones y IPv6 es el formato más nuevo. Tu proveedor, router, sistema operativo y navegador determinan cuál se usa para esta consulta.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Mi IP", path: "/mi-ip" }]}>
      <WebApplicationJsonLd
        name="Mi IP - IPLibre"
        description="Consulta tu IP pública y datos de conexión."
        path="/mi-ip"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta insignia"
        title="Mi IP"
        description="Ver tu IP pública, comprobar si es IPv4 o IPv6 y entender qué datos básicos expone tu conexión."
      />
      <MyIp />

      <RelatedLinks
        title="Comprueba también"
        links={[
          { href: "/webrtc-leak-test", label: "WebRTC Leak Test", description: "Detecta si el navegador revela IP adicionales" },
          { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide descarga, subida, ping y jitter" },
          { href: "/test-ipv6", label: "Test IPv6", description: "Comprueba compatibilidad IPv6" },
        ]}
      />

      <section className="prose mt-12 max-w-none">
        <h2>Qué puedes saber con tu dirección IP</h2>
        <p>
          Esta herramienta responde consultas habituales como cuál es mi IP, ver mi IP pública o
          comprobar cuál es mi IPv4 o cuál es mi IPv6. Además muestra proveedor, ASN y ubicación
          aproximada cuando la fuente pública dispone de esos datos.
        </p>
        <p>
          La IP sirve para enrutar tráfico en Internet, pero no identifica por sí sola a una persona.
          Redes móviles, CGNAT, VPN, proxies, Wi-Fi corporativo y cambios del proveedor pueden hacer
          que los datos varíen.
        </p>
        <h2>Privacidad y VPN</h2>
        <p>
          Si usas una VPN, compara la IP mostrada aquí con el país y proveedor esperados. Después
          ejecuta el WebRTC Leak Test para comprobar si el navegador expone direcciones adicionales
          por WebRTC.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>
    </ToolPage>
  );
}
