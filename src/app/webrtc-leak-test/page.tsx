import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { WebrtcLeakTest } from "@/components/tools/WebrtcLeakTest";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WebRTC Leak Test: comprueba posibles fugas de IP | IPLibre",
  description:
    "Comprueba si tu navegador revela tu dirección IP mediante WebRTC. La prueba se ejecuta en tu navegador analizando los candidatos ICE, sin enviar tus IP a ningún servidor.",
  path: "/webrtc-leak-test",
});

const faqs = [
  {
    q: "¿Qué es una fuga de WebRTC?",
    a: "WebRTC es la tecnología de llamadas y videollamadas del navegador. Para conectar dos equipos, necesita descubrir direcciones IP, y en algunas configuraciones puede revelar tu IP real aunque uses una VPN. A eso se le llama fuga de WebRTC.",
  },
  {
    q: "¿Esta prueba detecta todas las fugas de VPN?",
    a: "No. Comprueba qué direcciones expone WebRTC mediante los candidatos ICE observados, pero no puede garantizar la detección de todas las fugas posibles ni conoce tu configuración de VPN. Úsala como una comprobación orientativa, no como una auditoría definitiva.",
  },
  {
    q: "¿Por qué veo direcciones que terminan en .local?",
    a: "Los navegadores modernos (Chrome, Firefox) ocultan tus IP locales tras nombres mDNS del tipo abcd-1234.local. No son direcciones IP privadas visibles: es una protección de privacidad. Verlas es una buena señal.",
  },
  {
    q: "¿Enviáis mi IP a vuestros servidores?",
    a: "El análisis de candidatos ocurre en tu navegador y no se envía a IPLibre. Para descubrir la IP reflejada se usa un servidor STUN público (como en una videollamada), y para comparar mostramos la IP pública que ya ve el servidor por tu conexión. No almacenamos ninguna de ellas.",
  },
  {
    q: "¿Cómo evito las fugas de WebRTC?",
    a: "Puedes usar una extensión que desactive WebRTC, una VPN que lo gestione correctamente, o desactivar WebRTC en la configuración del navegador. Ten en cuenta que desactivarlo puede afectar a las videollamadas.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "WebRTC Leak Test", path: "/webrtc-leak-test" }]}>
      <WebApplicationJsonLd
        name="WebRTC Leak Test — IPLibre"
        description="Comprueba si tu navegador revela tu IP mediante WebRTC, directamente desde el navegador."
        path="/webrtc-leak-test"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="WebRTC Leak Test"
        description="Comprueba si tu navegador revela información de red mediante WebRTC. La prueba se ejecuta en tu navegador y analiza los candidatos ICE que genera tu conexión."
      />
      <WebrtcLeakTest />

      <section className="prose mt-12 max-w-none">
        <h2>Cómo funciona esta prueba</h2>
        <p>
          Tu navegador crea una conexión WebRTC (<code>RTCPeerConnection</code>) con un servidor STUN
          público. Durante el proceso de <em>ICE gathering</em>, el navegador genera «candidatos»:
          posibles direcciones por las que se podría establecer la conexión. Analizamos esos
          candidatos y clasificamos cada dirección como local (host), reflejada (srflx) o
          retransmitida (relay), distinguiendo las IP públicas de las privadas y de los nombres mDNS.
        </p>
        <p>
          Después comparamos las IP públicas descubiertas con la IP pública que el servidor ya observa
          por tu conexión. Si coinciden, WebRTC no añade ninguna exposición. Si aparece una dirección
          distinta, puede indicar una fuga que conviene revisar, especialmente si usas una VPN.
        </p>

        <h2>Limitaciones que debes conocer</h2>
        <ul>
          <li>
            Chrome y Firefox ocultan las IP locales con mDNS, por lo que a menudo solo verás nombres{" "}
            <code>*.local</code>. Es lo esperado y no supone una fuga.
          </li>
          <li>
            Safari es más restrictivo con WebRTC y puede no generar candidatos hasta conceder
            permisos.
          </li>
          <li>
            Una VPN bien configurada normalmente evita las fugas, pero esta prueba no puede auditar tu
            VPN ni cubrir todos los escenarios.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Tu dirección IP pública" },
          { href: "/test-ipv6", label: "Test IPv6", description: "Compatibilidad IPv6 de tu conexión" },
          { href: "/generador-contrasenas", label: "Generador de contraseñas", description: "Contraseñas seguras" },
        ]}
      />
    </ToolPage>
  );
}
