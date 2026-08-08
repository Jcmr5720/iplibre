import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnssecChecker } from "@/components/tools/DnssecChecker";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Comprobar DNSSEC de un dominio online | IPLibre",
  description:
    "Comprueba si un dominio tiene DNSSEC: registros DS y DNSKEY, algoritmos, key tags y validación de la cadena de confianza mediante DNS-over-HTTPS.",
  path: "/dnssec-checker",
});

const faqs = [
  {
    q: "¿Qué es DNSSEC?",
    a: "DNSSEC (DNS Security Extensions) firma criptográficamente las respuestas DNS. Permite comprobar que la respuesta que recibes no ha sido manipulada por el camino, protegiendo frente a ataques de suplantación de DNS.",
  },
  {
    q: "¿Que un dominio no tenga DNSSEC significa que es inseguro?",
    a: "No. DNSSEC añade una capa de autenticidad a las respuestas DNS, pero su ausencia no significa por sí sola que el sitio sea inseguro o malicioso. Muchos dominios legítimos todavía no lo han desplegado.",
  },
  {
    q: "¿Qué son los registros DS y DNSKEY?",
    a: "DNSKEY contiene las claves públicas con las que se firma la zona. DS es un resumen (hash) de una de esas claves, publicado en la zona padre para enlazar la cadena de confianza. Se necesitan ambos, bien encadenados, para que la validación funcione.",
  },
  {
    q: "¿Cómo comprobáis la validación?",
    a: "Consultamos DS y DNSKEY por DNS-over-HTTPS y leemos el flag AD (Authenticated Data) de un resolutor validante. Si una consulta validante falla pero funciona con la validación desactivada (CD=1), lo señalamos como un posible problema de firma (zona «bogus»).",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Comprobar DNSSEC", path: "/dnssec-checker" }]}>
      <WebApplicationJsonLd
        name="DNSSEC Checker — IPLibre"
        description="Comprueba el estado DNSSEC de un dominio: DS, DNSKEY y validación de la cadena de confianza."
        path="/dnssec-checker"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar DNSSEC"
        description="Analiza si un dominio tiene DNSSEC activo: registros DS y DNSKEY, algoritmos y estado de validación de la cadena de confianza."
      />
      <DnssecChecker />

      <section className="prose mt-12 max-w-none">
        <h2>Qué comprueba esta herramienta</h2>
        <p>
          Consultamos por DNS-over-HTTPS los registros <code>DNSKEY</code> (las claves con las que se
          firma la zona) y <code>DS</code> (el enlace de confianza publicado en la zona padre). A
          continuación leemos el flag <code>AD</code> de un resolutor validante para saber si la
          respuesta se autentica correctamente, y detectamos zonas con firmas rotas cruzando la
          consulta con la validación desactivada.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/dns-lookup", label: "DNS Lookup", description: "Registros A, MX, TXT y más" },
          { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara resolutores públicos" },
          { href: "/email-security-checker", label: "SPF, DKIM y DMARC", description: "Seguridad del correo" },
        ]}
      />
    </ToolPage>
  );
}
