import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { EmailSecurityChecker } from "@/components/tools/EmailSecurityChecker";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Comprobar SPF, DKIM y DMARC de un dominio | IPLibre",
  description:
    "Analiza la autenticación de correo de un dominio: registros SPF, DMARC y DKIM. Detecta políticas, mecanismos, informes y errores de configuración comunes.",
  path: "/email-security-checker",
});

const faqs = [
  {
    q: "¿Qué son SPF, DKIM y DMARC?",
    a: "Son tres mecanismos que ayudan a evitar la suplantación de correo. SPF declara qué servidores pueden enviar en nombre del dominio; DKIM firma criptográficamente los mensajes; y DMARC indica qué hacer cuando SPF o DKIM fallan, y dónde enviar los informes.",
  },
  {
    q: "¿Por qué necesito un selector para comprobar DKIM?",
    a: "La clave pública DKIM se publica en selector._domainkey.tudominio.com, y cada proveedor usa su propio selector (por ejemplo google, selector1 o s1). No es posible conocer automáticamente todos los selectores de un dominio, así que debes indicar el que corresponda.",
  },
  {
    q: "¿p=none en DMARC es un error?",
    a: "No necesariamente. p=none permite recopilar informes sin rechazar mensajes; es un buen punto de partida para monitorizar antes de endurecer la política a quarantine o reject. Lo señalamos como mejorable, no como fallo.",
  },
  {
    q: "¿Es esto una auditoría completa de mi correo?",
    a: "No. Comprobamos la presencia y configuración de los registros DNS de autenticación. Es una guía orientativa; no analiza la entrega real de cada mensaje ni el comportamiento de tu servidor.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "SPF, DKIM y DMARC", path: "/email-security-checker" }]}>
      <WebApplicationJsonLd
        name="Comprobador SPF, DKIM y DMARC — IPLibre"
        description="Analiza los registros de autenticación de correo de un dominio: SPF, DMARC y DKIM."
        path="/email-security-checker"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar SPF, DKIM y DMARC"
        description="Analiza la autenticación de correo de un dominio. Comprueba los registros SPF y DMARC y, con un selector, también DKIM."
      />
      <EmailSecurityChecker />

      <section className="prose mt-12 max-w-none">
        <h2>Qué comprueba esta herramienta</h2>
        <p>
          Consultamos por DNS-over-HTTPS los registros TXT de autenticación de correo. Para{" "}
          <strong>SPF</strong> analizamos los mecanismos (<code>include</code>, <code>ip4</code>,{" "}
          <code>ip6</code>, <code>a</code>, <code>mx</code>), la política final (<code>~all</code>,{" "}
          <code>-all</code>…) y el número de búsquedas DNS frente al límite del RFC. Para{" "}
          <strong>DMARC</strong> leemos la política (<code>p</code>), el porcentaje, la alineación y
          las direcciones de informes. Para <strong>DKIM</strong>, si indicas un selector, obtenemos y
          validamos la clave pública.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/dns-lookup", label: "DNS Lookup", description: "Registros TXT, MX y más" },
          { href: "/dnssec-checker", label: "DNSSEC Checker", description: "Autenticidad de las respuestas DNS" },
          { href: "/whois", label: "WHOIS / RDAP", description: "Datos de registro del dominio" },
        ]}
      />
    </ToolPage>
  );
}
