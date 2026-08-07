import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SslChecker } from "@/components/tools/SslChecker";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "SSL Checker: comprobar certificado SSL online",
  description:
    "Analiza el certificado HTTPS de cualquier dominio: validez, fecha de vencimiento, días restantes, emisor, SAN y huella SHA-256. Comprueba si un certificado SSL está a punto de caducar.",
  path: "/ssl-checker",
});

const faqs = [
  {
    q: "¿Un certificado SSL válido significa que el sitio es seguro?",
    a: "No. Un certificado válido garantiza que la conexión está cifrada y que el dominio coincide, pero no que el contenido o el propietario del sitio sean de confianza. Un sitio fraudulento también puede tener HTTPS.",
  },
  {
    q: "¿Cuándo debo renovar un certificado?",
    a: "Lo recomendable es renovar antes de los 30 días previos al vencimiento. Con menos de 7 días el riesgo de interrupción es alto. Muchos certificados (como Let's Encrypt) se renuevan automáticamente.",
  },
  {
    q: "¿Qué es el fingerprint SHA-256?",
    a: "Es una huella única del certificado. Sirve para identificarlo o compararlo (por ejemplo, en técnicas de fijación de certificados).",
  },
  {
    q: "¿Analizáis certificados expirados o inválidos?",
    a: "Sí. Nos conectamos para inspeccionar el certificado aunque esté caducado, no coincida el dominio o la cadena no sea de confianza, y te lo indicamos claramente.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "SSL Checker", path: "/ssl-checker" }]}>
      <WebApplicationJsonLd
        name="SSL Checker — IPLibre"
        description="Analiza el certificado HTTPS de un dominio y comprueba su validez y vencimiento."
        path="/ssl-checker"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar certificado SSL"
        description="Analiza el certificado HTTPS de un dominio y comprueba si es válido y cuándo vence, con los datos técnicos que necesitas."
      />
      <SslChecker />

      <section className="prose mt-12 max-w-none">
        <h2>Qué comprueba esta herramienta</h2>
        <p>
          Nos conectamos al puerto 443 del dominio e inspeccionamos su certificado TLS: validez de la
          cadena, coincidencia del nombre de host, fechas de emisión y vencimiento, días restantes,
          entidad emisora, nombres alternativos (SAN), número de serie y huella SHA-256.
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
          { href: "/whois", label: "WHOIS / RDAP", description: "Datos de registro del dominio" },
        ]}
      />
    </ToolPage>
  );
}
