import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { Diagnostics } from "@/components/tools/Diagnostics";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Diagnóstico de Internet - Chequeo integral de tu conexión",
  description:
    "Comprueba el estado de tu conexión: IP pública, IPv4/IPv6, resolución DNS, acceso HTTPS, latencia y jitter. Con recomendaciones claras.",
  path: "/diagnostico-de-internet",
});

const faqs = [
  {
    q: "¿Qué revisa el diagnóstico?",
    a: "Reúne señales básicas de navegador, conexión, DNS, HTTPS y latencia para orientar dónde puede estar un problema.",
  },
  {
    q: "¿Sustituye a un test de velocidad?",
    a: "No. Sirve como chequeo general. Para medir descarga, subida, ping y jitter con más detalle usa el Test de velocidad.",
  },
  {
    q: "¿Por qué una prueba puede fallar si Internet funciona?",
    a: "Algunos bloqueadores, redes corporativas, DNS filtrado, VPN o firewalls pueden impedir una comprobación concreta sin cortar toda la navegación.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Diagnóstico de Internet", path: "/diagnostico-de-internet" }]}>
      <WebApplicationJsonLd
        name="Diagnóstico de Internet - IPLibre"
        description="Chequeo integral del estado de tu conexión."
        path="/diagnostico-de-internet"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Diagnóstico de Internet"
        description="Un chequeo integral que reúne el estado de tu conexión en una sola pantalla, distinguiendo cada capa: navegador, HTTPS, DNS y latencia."
      />
      <Diagnostics />

      <section className="prose mt-12 max-w-none">
        <h2>Cómo usar el diagnóstico</h2>
        <p>
          Esta vista sirve para separar problemas: si DNS falla, puede que el navegador no resuelva
          dominios; si HTTPS falla, puede haber bloqueo o interceptación; si la latencia es alta, la
          conexión puede sentirse lenta aunque haya acceso a Internet.
        </p>
        <h2>Siguiente paso recomendado</h2>
        <p>
          Si el diagnóstico marca un problema concreto, usa la herramienta especializada
          correspondiente. Mi IP ayuda a verificar tu salida a Internet, DNS Lookup revisa registros y
          Test de velocidad mide rendimiento de descarga, subida, ping y jitter.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/mi-ip", label: "Mi IP", description: "Identifica tu conexión pública" },
          { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide descarga, subida y latencia" },
          { href: "/dns-lookup", label: "DNS Lookup", description: "Revisa resolución DNS" },
        ]}
      />
    </ToolPage>
  );
}
