import type { Metadata } from "next";
import Link from "next/link";
import { LearnLayout } from "@/components/content/LearnLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "¿Qué es DNS? — Cómo funciona el sistema de nombres de dominio",
  description:
    "Qué es el DNS, cómo traduce nombres como ejemplo.com en direcciones IP, qué son los registros A, MX, TXT o NS y por qué un DNS lento ralentiza tu navegación.",
  path: "/que-es-dns",
});

export default function Page() {
  return (
    <LearnLayout
      title="¿Qué es DNS?"
      breadcrumbLabel="¿Qué es DNS?"
      path="/que-es-dns"
      intro="El DNS (Domain Name System) es la guía telefónica de Internet: convierte los nombres que escribimos, como ejemplo.com, en las direcciones IP que las máquinas necesitan para conectarse."
      faqs={[
        {
          q: "¿Por qué a veces una web nueva no carga hasta pasadas unas horas?",
          a: "Porque los cambios de DNS necesitan propagarse por los distintos resolutores del mundo. Cada registro tiene un TTL (tiempo de vida) que indica cuánto se guarda en caché. Puedes comparar cómo lo ven varios resolutores con la herramienta de propagación DNS.",
        },
        {
          q: "¿Cambiar mi DNS hace más rápida mi conexión?",
          a: "No aumenta tu ancho de banda, pero un resolutor rápido (como 1.1.1.1 o 8.8.8.8) puede reducir el tiempo de resolución de nombres y hacer que las webs empiecen a cargar antes.",
        },
        {
          q: "¿Qué es un registro MX?",
          a: "Es el registro DNS que indica qué servidores reciben el correo de un dominio. Si tu email no llega, revisar los registros MX (y SPF/DKIM en los TXT) suele ser el primer paso.",
        },
      ]}
      related={[
        { href: "/comprobar-dns", label: "Comprobar DNS", description: "Consulta registros de un dominio" },
        { href: "/dns-lookup", label: "DNS Lookup", description: "A, AAAA, MX, TXT y más" },
        { href: "/propagacion-dns", label: "Propagación DNS", description: "Compara resolutores" },
        { href: "/reverse-dns", label: "Reverse DNS", description: "El registro PTR de una IP" },
      ]}
    >
      <h2>Del nombre a la dirección</h2>
      <p>
        Las personas recordamos nombres; las máquinas se entienden con números. Cuando escribes{" "}
        <code>ejemplo.com</code>, tu dispositivo pregunta a un servidor DNS «¿qué IP tiene este
        nombre?». La respuesta —por ejemplo <code>93.184.216.34</code>— es la que se usa realmente
        para establecer la conexión. Todo ocurre en milésimas de segundo, antes de que veas nada en
        pantalla.
      </p>

      <h2>Cómo funciona la resolución</h2>
      <p>
        La consulta pasa por varios niveles: el <strong>resolutor</strong> de tu proveedor (o uno
        público como Cloudflare o Google), los servidores <strong>raíz</strong>, los de cada{" "}
        <strong>TLD</strong> (<code>.com</code>, <code>.es</code>…) y, por fin, los servidores{" "}
        <strong>autoritativos</strong> del dominio. Para no repetir todo el proceso cada vez, las
        respuestas se guardan en caché durante un tiempo definido por el <strong>TTL</strong>.
      </p>

      <h2>Tipos de registro más comunes</h2>
      <ul>
        <li><strong>A / AAAA:</strong> la IPv4 o IPv6 de un nombre.</li>
        <li><strong>CNAME:</strong> un alias que apunta a otro nombre.</li>
        <li><strong>MX:</strong> los servidores de correo del dominio.</li>
        <li><strong>TXT:</strong> texto libre; se usa para SPF, DKIM y verificaciones.</li>
        <li><strong>NS:</strong> los servidores de nombres autoritativos.</li>
        <li><strong>SOA, SRV, CAA:</strong> configuración avanzada de la zona.</li>
      </ul>
      <p>
        Puedes ver todos ellos para cualquier dominio con la herramienta de{" "}
        <Link href="/comprobar-dns">comprobar DNS</Link> y contrastar cómo los resuelven distintos
        servidores con la <Link href="/propagacion-dns">propagación DNS</Link>.
      </p>
    </LearnLayout>
  );
}
