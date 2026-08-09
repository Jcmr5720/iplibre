import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ReverseDns } from "@/components/tools/ReverseDns";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { Faq } from "@/components/content/Faq";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reverse DNS (PTR) - Nombre de host de una IP",
  description:
    "Consulta el registro PTR (reverse DNS) de una IPv4 o IPv6, o resuelve un dominio a sus direcciones IP. Diferencia clara entre resolución directa e inversa.",
  path: "/reverse-dns",
});

const faqs = [
  {
    q: "¿Qué es un registro PTR?",
    a: "Es el registro DNS inverso que asocia una IP con un nombre de host. Se consulta en zonas in-addr.arpa para IPv4 e ip6.arpa para IPv6.",
  },
  {
    q: "¿Todas las IP tienen reverse DNS?",
    a: "No. Es normal que muchas IP no tengan PTR. Su configuración depende del proveedor que controla el bloque de direcciones.",
  },
  {
    q: "¿PTR y registro A deben coincidir?",
    a: "No siempre, pero en correo y operaciones de red suele esperarse coherencia entre PTR, A/AAAA y el nombre del servidor.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Reverse DNS", path: "/reverse-dns" }]}>
      <WebApplicationJsonLd
        name="Reverse DNS - IPLibre"
        description="Consulta el registro PTR de una IP o resuelve un dominio."
        path="/reverse-dns"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Reverse DNS (PTR)"
        description="Obtén el nombre de host asociado a una IP mediante su registro PTR, o resuelve un dominio a sus IP. Muchas IP no tienen PTR, y eso es normal."
      />
      <ReverseDns />

      <section className="prose mt-12 max-w-none">
        <h2>Cuándo revisar reverse DNS</h2>
        <p>
          El reverse DNS es útil al diagnosticar correo, reputación de servidores, inventarios de red
          o configuraciones de hosting. En servidores de correo, un PTR coherente suele reducir
          problemas de entrega.
        </p>
        <h2>Limitaciones</h2>
        <p>
          Un PTR es informativo: no prueba propiedad del dominio ni garantiza legitimidad. Para una
          revisión completa conviene combinarlo con DNS Lookup, WHOIS/RDAP y comprobaciones de correo.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/dns-lookup", label: "DNS Lookup", description: "Compara A, AAAA y PTR" },
          { href: "/email-security-checker", label: "SPF, DKIM y DMARC", description: "Seguridad de correo" },
          { href: "/whois", label: "WHOIS / RDAP", description: "Datos del bloque o dominio" },
        ]}
      />
    </ToolPage>
  );
}
