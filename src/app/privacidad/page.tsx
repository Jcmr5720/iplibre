import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/content/LegalLayout";
import { PrivacyPreferencesButton } from "@/components/privacy/PrivacyPreferencesButton";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Politica de privacidad",
  description: "Como trata IPLibre los datos y que tecnologias opcionales requieren consentimiento.",
  path: "/privacidad",
});

export default function Page() {
  return (
    <LegalLayout
      title="Politica de privacidad"
      breadcrumbLabel="Privacidad"
      path="/privacidad"
      updated="9 de agosto de 2026"
      intro="IPLibre esta pensado para diagnosticar tu conexion sin crear perfiles de usuario."
    >
      <h2>Que datos tratamos</h2>
      <p>
        Para que las herramientas funcionen, tu navegador envia tu direccion IP al servidor, algo
        inherente a cualquier conexion web. La usamos en el momento para responder a tu consulta,
        por ejemplo para mostrar tu IP o calcular una geolocalizacion aproximada. IPLibre no
        mantiene una cuenta de usuario ni una base de datos de perfiles personales.
      </p>

      <h2>Que no hacemos</h2>
      <ul>
        <li>No vendemos informacion personal.</li>
        <li>No usamos Google Analytics.</li>
        <li>No activamos analitica, preferencias ni publicidad antes de tu consentimiento.</li>
        <li>No usamos huellas digitales invasivas para seguirte entre sitios.</li>
      </ul>

      <h2>Consentimiento y almacenamiento local</h2>
      <p>
        La decision de privacidad se guarda en localStorage como tecnologia necesaria. El tema
        claro/oscuro y el historial local del test de velocidad solo se guardan si aceptas
        Preferencias. Puedes cambiarlo aqui:
      </p>
      <div className="not-prose my-4">
        <PrivacyPreferencesButton />
      </div>

      <h2>Analitica y rendimiento</h2>
      <p>
        Vercel Web Analytics y Vercel Speed Insights solo se cargan si aceptas Analitica. Los usamos
        para entender uso agregado, errores de experiencia y rendimiento real del sitio. No usamos
        esos datos para crear perfiles individuales.
      </p>

      <h2>Publicidad</h2>
      <p>
        AdSense esta declarado como tecnologia de marketing y no se carga antes de aceptar esa
        categoria. Si en el futuro se muestran anuncios, el tratamiento de Google se regira tambien
        por sus propias politicas y controles.
      </p>

      <h2>Herramientas y proveedores externos</h2>
      <p>
        Algunas herramientas consultan proveedores externos para obtener resultados: DNS,
        RDAP/WHOIS, ASN/BGP, geolocalizacion IP, comprobaciones HTTP/SSL y endpoints de velocidad o
        conectividad. Enviamos solo la consulta necesaria para devolver el resultado solicitado.
      </p>

      <h2>Contacto, donaciones y correo</h2>
      <p>
        Si envias el formulario de contacto, procesamos el contenido que escribes para responderte.
        El envio puede realizarse mediante Resend desde el servidor. Si haces una donacion, el pago
        se procesa en Mercado Pago cuando decides continuar al checkout.
      </p>

      <h2>Cookies y tecnologias similares</h2>
      <p>
        El inventario completo de localStorage, scripts externos y servicios asociados esta en la{" "}
        <Link href="/cookies">politica de cookies</Link>.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Como IPLibre no mantiene cuentas de usuario ni perfiles asociados, normalmente no conserva
        informacion personal que pueda localizarse por cuenta. Para cualquier consulta sobre
        privacidad, usa la pagina de contacto de {siteConfig.name}.
      </p>
    </LegalLayout>
  );
}
