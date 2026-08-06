import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Aviso legal",
  description: "Información legal del servicio IPLibre.",
  path: "/aviso-legal",
});

export default function Page() {
  return (
    <LegalLayout
      title="Aviso legal"
      breadcrumbLabel="Aviso legal"
      path="/aviso-legal"
      updated="6 de agosto de 2026"
    >
      <h2>Titularidad</h2>
      <p>
        {siteConfig.name} es un servicio informativo de diagnóstico de red. Los datos identificativos
        y de contacto del responsable se publicarán en esta sección cuando estén disponibles. No se
        facilitan datos jurídicos que no hayan sido verificados.
      </p>
      <h2>Finalidad</h2>
      <p>
        Las herramientas tienen finalidad informativa y diagnóstica. No constituyen asesoramiento
        profesional ni una certificación oficial de la calidad de tu conexión.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>
        La identidad visual, los textos y el código de {siteConfig.name} son originales. Las marcas,
        nombres y datos de terceros que puedan aparecer en los resultados pertenecen a sus
        respectivos titulares y se muestran únicamente con fines informativos.
      </p>
      <h2>Responsabilidad sobre fuentes externas</h2>
      <p>
        Los datos de WHOIS/RDAP, DNS, ASN y geolocalización provienen de fuentes externas públicas.
        {" "}
        {siteConfig.name} no controla su disponibilidad ni garantiza su exactitud.
      </p>
      <h2>Uso responsable</h2>
      <p>
        No debe utilizarse el servicio para acosar o identificar a personas, atacar redes o realizar
        actividades ilegales. El uso de las herramientas implica la aceptación de los términos.
      </p>
    </LegalLayout>
  );
}
