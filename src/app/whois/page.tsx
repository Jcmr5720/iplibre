import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { WhoisLookup } from "@/components/tools/WhoisLookup";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WHOIS / RDAP — Consulta dominios, IP y ASN",
  description:
    "Consulta datos de registro de dominios, direcciones IP y ASN mediante RDAP, el sucesor estandarizado de WHOIS: registrador, fechas, estados, DNSSEC y contactos públicos.",
  path: "/whois",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "WHOIS / RDAP", path: "/whois" }]}>
      <WebApplicationJsonLd
        name="WHOIS / RDAP — IPLibre"
        description="Consulta datos de registro de dominios, IP y ASN."
        path="/whois"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="WHOIS / RDAP"
        description="Consulta los datos de registro de un dominio, una IP o un ASN. Usamos RDAP, el protocolo estandarizado y estructurado que sucede a WHOIS."
      />
      <WhoisLookup />
    </ToolPage>
  );
}
