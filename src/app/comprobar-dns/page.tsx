import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnsLookup } from "@/components/tools/DnsLookup";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Comprobar DNS — Verifica los registros DNS de un dominio",
  description:
    "Comprueba los registros DNS de cualquier dominio (A, AAAA, MX, TXT, NS, CNAME y más) vía DNS-over-HTTPS. Verifica configuraciones de correo, webs y certificados al instante.",
  path: "/comprobar-dns",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Comprobar DNS", path: "/comprobar-dns" }]}>
      <WebApplicationJsonLd
        name="Comprobar DNS — IPLibre"
        description="Comprueba los registros DNS de un dominio en tiempo real."
        path="/comprobar-dns"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar DNS de un dominio"
        description="Verifica los registros DNS de cualquier dominio mediante DNS-over-HTTPS. Útil para revisar tu correo (MX, SPF, DKIM), apuntar tu web o diagnosticar por qué un dominio no resuelve."
      />
      <DnsLookup />

      <RelatedLinks
        links={[
          { href: "/que-es-dns", label: "¿Qué es DNS?", description: "El sistema de nombres, explicado" },
          { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara varios resolutores" },
          { href: "/reverse-dns", label: "Reverse DNS", description: "El registro PTR de una IP" },
          { href: "/whois", label: "WHOIS / RDAP", description: "Datos de registro del dominio" },
        ]}
      />
    </ToolPage>
  );
}
