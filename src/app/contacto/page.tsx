import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { ContactForm } from "@/components/tools/ContactForm";
import { Alert } from "@/components/ui/Alert";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description: "Ponte en contacto con el equipo de IPLibre para dudas y sugerencias.",
  path: "/contacto",
});

export default function Page() {
  const configured = Boolean(siteConfig.contact.email);
  return (
    <ToolPage breadcrumbs={[{ name: "Contacto", path: "/contacto" }]}>
      <PageHeader
        title="Contacto"
        description="¿Tienes una duda, una sugerencia o has encontrado un error? Escríbenos."
      />
      <div className="max-w-2xl">
        {!configured && (
          <Alert tone="info" className="mb-6">
            El canal de correo está en configuración. Puedes enviar el formulario: validaremos y
            registraremos tu mensaje, y lo atenderemos en cuanto el buzón esté operativo. No
            inventamos direcciones de contacto que no existan.
          </Alert>
        )}
        <ContactForm />
      </div>
    </ToolPage>
  );
}
