import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { WebsiteStatus } from "@/components/tools/WebsiteStatus";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Estado de una web: comprobar si una página está caída",
  description:
    "Comprueba si una web está disponible, su código HTTP, tiempo de respuesta y redirecciones. Diferencia entre servidor inaccesible y error HTTP (403/404). Gratis y sin registro.",
  path: "/estado-web",
});

const faqs = [
  {
    q: "¿Qué significa que una web devuelve 403 o 404?",
    a: "Que el servidor está accesible y responde, pero bloqueó tu petición (403) o el recurso no existe (404). No es lo mismo que estar caída: el servidor funciona.",
  },
  {
    q: "¿Cómo sé si un sitio está realmente caído?",
    a: "Cuando no se puede establecer conexión (error de DNS, TLS o de red) el servidor está inaccesible. Si responde con cualquier código HTTP, el servidor está operativo aunque devuelva un error.",
  },
  {
    q: "¿Comprueba la web desde mi ubicación?",
    a: "La comprobación se realiza desde nuestros servidores, no desde tu red. Un sitio puede estar caído para ti por un problema local aunque aquí figure disponible.",
  },
  {
    q: "¿Guardáis las URLs que compruebo?",
    a: "No almacenamos de forma permanente las URLs consultadas ni los resultados. Solo se aplican límites técnicos para evitar abusos.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Estado web", path: "/estado-web" }]}>
      <WebApplicationJsonLd
        name="Comprobar estado de una web — IPLibre"
        description="Comprueba si una página está disponible, su código HTTP y su tiempo de respuesta."
        path="/estado-web"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar estado de una web"
        description="Comprueba si una página está disponible, cuánto tarda en responder y qué estado HTTP devuelve. Distingue con claridad entre un servidor caído y un error HTTP."
      />
      <WebsiteStatus />

      <section className="prose mt-12 max-w-none">
        <h2>Cómo interpretar los resultados</h2>
        <p>
          Un código <strong>2xx</strong> indica que la página funciona. Un <strong>3xx</strong>{" "}
          significa que el servidor redirige a otra dirección (te mostramos el destino final). Un{" "}
          <strong>4xx</strong> quiere decir que el servidor responde pero hay un problema con la
          petición o el recurso, y un <strong>5xx</strong> señala un fallo del propio servidor.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/ssl-checker", label: "SSL Checker", description: "Comprueba el certificado HTTPS" },
          { href: "/headers-seguridad", label: "Headers de seguridad", description: "Protecciones HTTP de la web" },
          { href: "/dns-lookup", label: "DNS Lookup", description: "Registros DNS del dominio" },
        ]}
      />
    </ToolPage>
  );
}
