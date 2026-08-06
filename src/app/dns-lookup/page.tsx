import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { DnsLookup } from "@/components/tools/DnsLookup";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "DNS Lookup — Consulta registros A, AAAA, MX, TXT y más",
  description:
    "Consulta registros DNS de cualquier dominio (A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, CAA, DS, DNSKEY) vía DNS-over-HTTPS. Exporta a JSON y CSV.",
  path: "/dns-lookup",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "DNS Lookup", path: "/dns-lookup" }]}>
      <WebApplicationJsonLd
        name="DNS Lookup — IPLibre"
        description="Consulta registros DNS de un dominio."
        path="/dns-lookup"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="DNS Lookup"
        description="Consulta los registros DNS de un dominio mediante DNS-over-HTTPS. Elige un tipo concreto o pide todos los registros compatibles a la vez."
      />
      <DnsLookup />
    </ToolPage>
  );
}
