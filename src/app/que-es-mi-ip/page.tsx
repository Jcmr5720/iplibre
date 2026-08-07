import type { Metadata } from "next";
import Link from "next/link";
import { LearnLayout } from "@/components/content/LearnLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "¿Qué es mi IP? — Qué es una dirección IP y para qué sirve",
  description:
    "Explicación clara de qué es una dirección IP, la diferencia entre IP pública y privada, IPv4 e IPv6, y qué información revela (y qué no) sobre ti.",
  path: "/que-es-mi-ip",
});

export default function Page() {
  return (
    <LearnLayout
      title="¿Qué es mi IP?"
      breadcrumbLabel="¿Qué es mi IP?"
      path="/que-es-mi-ip"
      intro="Una dirección IP es el identificador que permite que tu dispositivo envíe y reciba datos por Internet. Aquí te explicamos qué es, qué tipos existen y qué revela realmente sobre ti."
      faqs={[
        {
          q: "¿Mi dirección IP revela mi identidad o mi domicilio exacto?",
          a: "No. Una IP identifica a una red, no a una persona. La ubicación asociada es aproximada y suele apuntar a la ciudad o al nodo de tu proveedor, no a tu domicilio. Solo tu operador puede vincular una IP con un abonado concreto, y únicamente por vías legales.",
        },
        {
          q: "¿Por qué mi IP cambia de vez en cuando?",
          a: "La mayoría de los proveedores asignan IP dinámicas: pueden cambiar al reiniciar el router o pasado un tiempo. Si necesitas una IP fija (por ejemplo para alojar un servicio), tu operador puede ofrecer una IP estática.",
        },
        {
          q: "¿Es lo mismo la IP pública que la privada?",
          a: "No. La IP pública es la que ve Internet (una por conexión). Las IP privadas (como 192.168.x.x) las asigna tu router a cada dispositivo dentro de casa y no son visibles desde fuera.",
        },
      ]}
      related={[
        { href: "/cual-es-mi-ip", label: "Ver cuál es mi IP", description: "Consulta tu IP ahora" },
        { href: "/ipv4-vs-ipv6", label: "IPv4 vs IPv6", description: "Diferencias entre protocolos" },
        { href: "/geolocalizar-ip", label: "Geolocalizar una IP", description: "Ubicación aproximada" },
        { href: "/que-es-dns", label: "¿Qué es DNS?", description: "Cómo se traducen los nombres" },
      ]}
    >
      <h2>Una dirección para cada conexión</h2>
      <p>
        Igual que una carta necesita una dirección postal para llegar a su destino, cada paquete de
        datos que viaja por Internet necesita una <strong>dirección IP</strong> (Internet Protocol)
        de origen y otra de destino. Es el número que identifica tu conexión en la red y permite que
        las respuestas —una página web, un vídeo, un mensaje— vuelvan hasta ti.
      </p>

      <h2>IP pública e IP privada</h2>
      <p>
        En tu casa conviven dos mundos. Hacia dentro, tu router reparte{" "}
        <strong>IP privadas</strong> (como <code>192.168.1.20</code>) a cada dispositivo: el móvil,
        el portátil, la tele. Hacia fuera, todos ellos comparten una única{" "}
        <strong>IP pública</strong>, que es la que ven los sitios web que visitas. Cuando consultas{" "}
        <Link href="/cual-es-mi-ip">cuál es tu IP</Link>, ves esa dirección pública.
      </p>

      <h2>IPv4 e IPv6</h2>
      <p>
        Existen dos formatos. <strong>IPv4</strong> usa cuatro números separados por puntos
        (<code>190.85.12.34</code>) y, al haberse agotado, ya no basta para todos los dispositivos
        del mundo. <strong>IPv6</strong> es su sucesor: direcciones mucho más largas en formato
        hexadecimal que ofrecen una cantidad prácticamente ilimitada. Lo vemos en detalle en{" "}
        <Link href="/ipv4-vs-ipv6">IPv4 vs IPv6</Link>.
      </p>

      <h2>¿Qué revela tu IP y qué no?</h2>
      <p>
        Tu IP permite estimar el país, la región y a veces la ciudad, además del proveedor de
        Internet que la anuncia (su <Link href="/asn-lookup">ASN</Link>). No revela tu nombre, tu
        dirección postal ni el contenido de tu tráfico. La geolocalización es orientativa: puedes
        comprobar su precisión geolocalizando tu propia IP.
      </p>
    </LearnLayout>
  );
}
