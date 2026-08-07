import type { Metadata } from "next";
import Link from "next/link";
import { LearnLayout } from "@/components/content/LearnLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "IPv4 vs IPv6 — Diferencias, ventajas y por qué convive",
  description:
    "Diferencias entre IPv4 e IPv6: formato de direcciones, por qué se agotó IPv4, qué mejora IPv6 (seguridad, autoconfiguración) y por qué hoy ambos protocolos conviven.",
  path: "/ipv4-vs-ipv6",
});

export default function Page() {
  return (
    <LearnLayout
      title="IPv4 vs IPv6"
      breadcrumbLabel="IPv4 vs IPv6"
      path="/ipv4-vs-ipv6"
      intro="IPv4 e IPv6 son las dos versiones del protocolo que da direcciones a Internet. IPv4 se agotó y IPv6 es su sucesor, con un espacio prácticamente infinito. Hoy conviven en la mayoría de conexiones."
      faqs={[
        {
          q: "¿Es mejor IPv6 que IPv4?",
          a: "IPv6 aporta un espacio de direcciones prácticamente ilimitado, autoconfiguración y un diseño más moderno. Para el usuario, la experiencia es equivalente; la ventaja principal es que evita el agotamiento de direcciones y las capas de NAT.",
        },
        {
          q: "¿Tengo que hacer algo para usar IPv6?",
          a: "Normalmente no. Si tu proveedor y tu router lo soportan, tu dispositivo obtiene una IPv6 automáticamente y la usa cuando el destino también la admite. Puedes comprobar si tienes IPv6 viendo cuál es tu IP.",
        },
        {
          q: "¿Por qué sigo viendo direcciones IPv4?",
          a: "Porque gran parte de Internet aún depende de IPv4 y ambos protocolos conviven (doble pila). Muchas conexiones usan IPv6 cuando pueden y recurren a IPv4 con el resto de servicios.",
        },
      ]}
      related={[
        { href: "/cual-es-mi-ip", label: "Ver cuál es mi IP", description: "¿Tienes IPv4 o IPv6?" },
        { href: "/que-es-mi-ip", label: "¿Qué es mi IP?", description: "Conceptos básicos" },
        { href: "/geolocalizar-ip", label: "Geolocalizar una IP", description: "Ubicación aproximada" },
        { href: "/asn-lookup", label: "ASN Lookup", description: "La red detrás de una IP" },
      ]}
    >
      <h2>Dos formatos, un mismo objetivo</h2>
      <p>
        Ambos protocolos hacen lo mismo: dar una dirección única a cada conexión para que los datos
        encuentren su destino. La diferencia está en cuántas direcciones permiten y cómo se escriben.
      </p>

      <h2>IPv4: sencillo pero agotado</h2>
      <p>
        Una dirección <strong>IPv4</strong> son cuatro números de 0 a 255 separados por puntos, como{" "}
        <code>190.85.12.34</code>. Permite unos 4.300 millones de direcciones, que parecían muchas en
        los años 80 pero se agotaron con la explosión de móviles, servidores y dispositivos
        conectados. Para estirarlas se usan técnicas como el NAT, que comparte una IP pública entre
        muchos dispositivos.
      </p>

      <h2>IPv6: espacio para todo</h2>
      <p>
        Una dirección <strong>IPv6</strong> es mucho más larga y se escribe en hexadecimal, como{" "}
        <code>2001:0db8:85a3::8a2e:0370:7334</code>. Ofrece una cantidad de direcciones tan enorme
        que, en la práctica, es inagotable. Además simplifica la autoconfiguración y elimina la
        necesidad de NAT, dando a cada dispositivo su propia dirección.
      </p>

      <h2>Por qué conviven</h2>
      <p>
        Migrar todo Internet a la vez es imposible, así que la mayoría de las conexiones funcionan en{" "}
        <strong>doble pila</strong>: usan IPv6 cuando el destino lo admite y IPv4 con el resto. Por
        eso puedes tener ambas a la vez. Comprueba cuál usa tu conexión viendo{" "}
        <Link href="/cual-es-mi-ip">cuál es tu IP</Link>.
      </p>
    </LearnLayout>
  );
}
