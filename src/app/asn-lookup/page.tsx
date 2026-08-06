import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { AsnLookup } from "@/components/tools/AsnLookup";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "ASN Lookup — Consulta un Sistema Autónomo o IP",
  description:
    "Consulta un ASN o una IP y obtén el nombre, organización, país, registro regional y los prefijos IPv4/IPv6 anunciados en BGP.",
  path: "/asn-lookup",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "ASN Lookup", path: "/asn-lookup" }]}>
      <WebApplicationJsonLd
        name="ASN Lookup — IPLibre"
        description="Consulta ASN, organización y prefijos anunciados."
        path="/asn-lookup"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="ASN Lookup"
        description="Introduce un número de Sistema Autónomo (p. ej. AS15169) o una IP para ver la organización responsable, su registro regional y los prefijos que anuncia."
      />
      <AsnLookup />
    </ToolPage>
  );
}
