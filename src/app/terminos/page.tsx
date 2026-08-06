import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Términos de uso",
  description: "Condiciones de uso del servicio IPLibre.",
  path: "/terminos",
});

export default function Page() {
  return (
    <LegalLayout
      title="Términos de uso"
      breadcrumbLabel="Términos"
      path="/terminos"
      updated="6 de agosto de 2026"
      intro="Al usar IPLibre aceptas estas condiciones. Léelas con atención."
    >
      <h2>1. Objeto del servicio</h2>
      <p>
        {siteConfig.name} ofrece herramientas gratuitas de diagnóstico de red con finalidad
        exclusivamente informativa y educativa: consulta de IP, medición de velocidad, DNS,
        WHOIS/RDAP, ASN, geolocalización aproximada y utilidades relacionadas.
      </p>
      <h2>2. Naturaleza orientativa de los resultados</h2>
      <ul>
        <li>Las ubicaciones geográficas de las IP son <strong>aproximadas</strong>.</li>
        <li>Los resultados de velocidad pueden <strong>variar</strong> según la hora, la red y el dispositivo.</li>
        <li>No se garantiza precisión absoluta de ningún dato.</li>
        <li>Los resultados <strong>no sustituyen</strong> una medición certificada de tu proveedor.</li>
        <li>Los datos WHOIS, RDAP, DNS y ASN provienen de <strong>fuentes externas</strong> públicas.</li>
        <li>{siteConfig.name} no controla la disponibilidad ni la exactitud de esas fuentes.</li>
      </ul>
      <h2>3. Uso aceptable</h2>
      <p>
        No debes utilizar el servicio para acosar o identificar a personas, atacar redes,
        sobrecargar las herramientas mediante automatización abusiva, ni realizar cualquier
        actividad ilegal. Aplicamos límites de uso para proteger el servicio.
      </p>
      <h2>4. Disponibilidad</h2>
      <p>
        El servicio se ofrece «tal cual» y «según disponibilidad», sin garantías de funcionamiento
        ininterrumpido. Podemos modificar o suspender funciones en cualquier momento.
      </p>
      <h2>5. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, {siteConfig.name} no se responsabiliza de decisiones
        tomadas a partir de los resultados ofrecidos ni de daños derivados del uso del servicio o de
        la indisponibilidad de fuentes externas.
      </p>
      <h2>6. Cambios en los términos</h2>
      <p>
        Podemos actualizar estos términos. La versión vigente será siempre la publicada en esta
        página con su fecha de actualización.
      </p>
    </LegalLayout>
  );
}
