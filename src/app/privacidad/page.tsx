import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Política de privacidad",
  description: "Cómo trata IPLibre los datos y protege tu privacidad.",
  path: "/privacidad",
});

export default function Page() {
  return (
    <LegalLayout
      title="Política de privacidad"
      breadcrumbLabel="Privacidad"
      path="/privacidad"
      updated="6 de agosto de 2026"
      intro="La privacidad es un principio de diseño de IPLibre, no un añadido."
    >
      <h2>Qué datos tratamos</h2>
      <p>
        Para que las herramientas funcionen, tu navegador envía tu dirección IP al servidor (algo
        inherente a cualquier conexión). La usamos <strong>en el momento</strong> para responder a tu
        consulta (por ejemplo, mostrar tu IP o su geolocalización aproximada) y{" "}
        <strong>no la almacenamos de forma permanente</strong>.
      </p>
      <h2>Qué NO hacemos</h2>
      <ul>
        <li>No vendemos ni compartimos tu información con terceros.</li>
        <li>No usamos cookies publicitarias ni huellas digitales invasivas.</li>
        <li>No registramos deliberadamente direcciones IP completas en analíticas.</li>
        <li>No creamos perfiles de usuario.</li>
      </ul>
      <h2>Historial de pruebas</h2>
      <p>
        El historial de tus pruebas de velocidad se guarda <strong>únicamente en tu navegador</strong>{" "}
        (almacenamiento local). No se sube a ningún servidor y puedes borrarlo en cualquier momento
        desde la propia herramienta.
      </p>
      <h2>Analítica</h2>
      <p>
        Podemos usar analítica agregada y respetuosa con la privacidad (por ejemplo, Vercel Analytics
        y Speed Insights) para conocer el rendimiento y el uso general del sitio, sin identificarte
        personalmente ni enviar tu IP completa de forma deliberada.
      </p>
      <h2>Fuentes externas</h2>
      <p>
        Al usar ciertas herramientas, las consultas se dirigen a proveedores externos (geolocalización
        IP, DNS-over-HTTPS, RDAP, BGPView). Estos servicios pueden tratar la consulta según sus
        propias políticas. Enviamos solo lo imprescindible para obtener el resultado.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Como no mantenemos una base de datos de usuarios ni almacenamos tu IP, no conservamos
        información personal que podamos asociar contigo. Si tienes dudas, contáctanos.
      </p>
      <h2>Contacto</h2>
      <p>
        Para cualquier consulta sobre privacidad, usa la página de contacto de {siteConfig.name}.
      </p>
    </LegalLayout>
  );
}
