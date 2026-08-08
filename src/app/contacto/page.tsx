import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ContactForm } from "@/components/tools/ContactForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description: "Ponte en contacto con el equipo de IPLibre para dudas y sugerencias.",
  path: "/contacto",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Contacto", path: "/contacto" }]}>
      <PageHeader
        title="Contacto"
        description="¿Tienes una duda, una sugerencia o has encontrado un error? Escríbenos."
      />
      <div className="max-w-2xl">
        <ContactForm />
      </div>
    </ToolPage>
  );
}
