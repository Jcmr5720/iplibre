import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { RedirectChecker } from "@/components/tools/RedirectChecker";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Comprobar redirecciones HTTP de una URL | IPLibre",
  description:
    "Sigue la cadena de redirecciones de una URL paso a paso: códigos 301, 302, 307, 308, tipo de redirección, HTTPS y tiempos. Detecta bucles y degradaciones a HTTP.",
  path: "/redirect-checker",
});

const faqs = [
  {
    q: "¿Qué hace esta herramienta?",
    a: "Sigue manualmente la cadena de redirecciones de una URL y muestra cada salto: la dirección, el código HTTP (301, 302, 307, 308…), el tipo de redirección, si usa HTTPS y el tiempo de respuesta, hasta llegar al destino final.",
  },
  {
    q: "¿Cuál es la diferencia entre 301 y 302?",
    a: "301 y 308 son redirecciones permanentes: el recurso se movió de forma definitiva y los buscadores trasladan la autoridad al destino. 302, 303 y 307 son temporales: la URL original sigue siendo la referencia.",
  },
  {
    q: "¿Detectáis bucles de redirección?",
    a: "Sí. Si la cadena vuelve a una URL ya visitada, lo señalamos como bucle. También avisamos si se supera el número máximo de saltos o si la cadena degrada de HTTPS a HTTP.",
  },
  {
    q: "¿Es seguro analizar cualquier URL?",
    a: "Sí. Reutilizamos la protección SSRF de IPLibre: solo http y https, y en cada salto revalidamos que el destino no apunte a direcciones internas, privadas o de metadatos. No leemos el contenido de las páginas.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Comprobar redirecciones", path: "/redirect-checker" }]}>
      <WebApplicationJsonLd
        name="Comprobador de redirecciones HTTP — IPLibre"
        description="Sigue la cadena de redirecciones de una URL paso a paso, con códigos, tipos y tiempos."
        path="/redirect-checker"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar redirecciones HTTP"
        description="Sigue la cadena completa de redirecciones de una URL, salto a salto, con el código HTTP, el tipo de redirección, HTTPS y los tiempos."
      />
      <RedirectChecker />

      <section className="prose mt-12 max-w-none">
        <h2>Qué comprueba esta herramienta</h2>
        <p>
          Partimos de la URL que indicas y seguimos cada cabecera <code>Location</code> manualmente,
          sin dejar que el navegador o el cliente HTTP resuelvan las redirecciones automáticamente.
          Así podemos mostrarte cada salto por separado, contar cuántas redirecciones hay, medir el
          tiempo de cada una y detectar problemas como bucles, cadenas demasiado largas o pasos de
          HTTPS a HTTP.
        </p>
        <h2>Seguridad</h2>
        <p>
          En cada salto revalidamos el destino con la protección SSRF de IPLibre: solo se permiten{" "}
          <code>http</code> y <code>https</code>, y se bloquea cualquier dirección interna, privada,
          de loopback o de metadatos, incluso si aparece a mitad de la cadena. No se lee ni se
          reenvía el contenido de las páginas.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/estado-web", label: "Estado web", description: "¿La página está disponible?" },
          { href: "/headers-seguridad", label: "Headers de seguridad", description: "Protecciones HTTP" },
          { href: "/ssl-checker", label: "SSL Checker", description: "Certificado HTTPS del dominio" },
        ]}
      />
    </ToolPage>
  );
}
