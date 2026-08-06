import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ReverseDns } from "@/components/tools/ReverseDns";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reverse DNS (PTR) — Nombre de host de una IP",
  description:
    "Consulta el registro PTR (reverse DNS) de una IPv4 o IPv6, o resuelve un dominio a sus direcciones IP. Diferencia clara entre resolución directa e inversa.",
  path: "/reverse-dns",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Reverse DNS", path: "/reverse-dns" }]}>
      <WebApplicationJsonLd
        name="Reverse DNS — IPLibre"
        description="Consulta el registro PTR de una IP o resuelve un dominio."
        path="/reverse-dns"
      />
      <PageHeader
        eyebrow="Herramienta"
        title="Reverse DNS (PTR)"
        description="Obtén el nombre de host asociado a una IP mediante su registro PTR, o resuelve un dominio a sus IP. Muchas IP no tienen PTR, y eso es normal."
      />
      <ReverseDns />
    </ToolPage>
  );
}
