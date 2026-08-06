import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Política de cookies",
  description: "Uso de cookies y almacenamiento local en IPLibre.",
  path: "/cookies",
});

export default function Page() {
  return (
    <LegalLayout
      title="Política de cookies"
      breadcrumbLabel="Cookies"
      path="/cookies"
      updated="6 de agosto de 2026"
      intro="IPLibre usa el mínimo almacenamiento imprescindible para funcionar."
    >
      <h2>Cookies publicitarias</h2>
      <p>
        En esta versión <strong>no utilizamos cookies publicitarias</strong> ni de seguimiento de
        terceros con fines de marketing.
      </p>
      <h2>Almacenamiento técnico y local</h2>
      <ul>
        <li>
          <strong>Preferencia de tema (claro/oscuro):</strong> se guarda localmente para recordar tu
          elección entre visitas.
        </li>
        <li>
          <strong>Historial de pruebas de velocidad:</strong> se guarda en el almacenamiento local de
          tu navegador y nunca se envía a un servidor.
        </li>
      </ul>
      <p>
        Este almacenamiento es técnico y necesario para ofrecer la funcionalidad que solicitas.
        Puedes borrarlo en cualquier momento desde la configuración de tu navegador o desde las
        propias herramientas.
      </p>
      <h2>Analítica</h2>
      <p>
        Las soluciones de analítica que empleamos están orientadas a la privacidad y no dependen de
        cookies de identificación personal.
      </p>
    </LegalLayout>
  );
}
