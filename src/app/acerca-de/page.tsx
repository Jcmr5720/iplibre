import type { Metadata } from "next";
import Link from "next/link";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Acerca de IPLibre",
  description:
    "Qué es IPLibre, cómo funciona y qué fuentes de datos utiliza para ofrecer un diagnóstico de Internet honesto, gratuito y respetuoso con la privacidad.",
  path: "/acerca-de",
});

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Acerca de", path: "/acerca-de" }]}>
      <PageHeader
        title={`Acerca de ${siteConfig.name}`}
        description="Una plataforma independiente para entender y diagnosticar tu conexión a Internet."
      />
      <article className="prose">
        <h2>Qué es IPLibre</h2>
        <p>
          {siteConfig.name} es un conjunto gratuito de herramientas de red pensadas para que
          cualquiera pueda consultar su dirección IP, medir la velocidad de su conexión y explorar
          datos técnicos como DNS, WHOIS/RDAP, ASN o la geolocalización aproximada de una IP.
        </p>
        <h2>Nuestros principios</h2>
        <ul>
          <li>
            <strong>Datos reales:</strong> todas las herramientas consultan fuentes públicas y
            muestran resultados verificables. No simulamos ni inventamos valores.
          </li>
          <li>
            <strong>Honestidad técnica:</strong> explicamos las limitaciones. La geolocalización es
            aproximada y la latencia que medimos es HTTPS, no ICMP.
          </li>
          <li>
            <strong>Privacidad:</strong> no almacenamos tu IP de forma permanente ni usamos
            rastreo publicitario. Tu historial de pruebas se guarda solo en tu navegador.
          </li>
        </ul>
        <h2>Fuentes de datos</h2>
        <p>
          IP y geolocalización mediante proveedores públicos con degradación en cadena; DNS mediante
          DNS-over-HTTPS (Cloudflare, Google, Quad9); WHOIS/RDAP a través del bootstrap RDAP
          estandarizado; e información de ASN y enrutamiento mediante BGPView. La disponibilidad de
          estas fuentes externas no depende de nosotros.
        </p>
        <h2>Contacto</h2>
        <p>
          ¿Tienes dudas o sugerencias? Escríbenos desde la{" "}
          <Link href="/contacto">página de contacto</Link>.
        </p>
      </article>
    </ToolPage>
  );
}
