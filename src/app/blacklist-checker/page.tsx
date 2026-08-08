import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { BlacklistChecker } from "@/components/tools/BlacklistChecker";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Comprobar IP en listas negras (DNSBL) | IPLibre",
  description:
    "Comprueba si una dirección IPv4 aparece en listas públicas de reputación (DNSBL/RBL). Consulta múltiples listas a la vez con un veredicto claro y honesto.",
  path: "/blacklist-checker",
});

const faqs = [
  {
    q: "¿Qué es una lista negra de IP (DNSBL)?",
    a: "Una DNSBL o RBL es una lista pública de direcciones IP asociadas a envío de spam o actividad abusiva. Los servidores de correo las consultan para decidir si aceptan o rechazan mensajes de una IP.",
  },
  {
    q: "¿Aparecer en una lista significa que la IP es maliciosa?",
    a: "No necesariamente. Esta IP aparece actualmente registrada en determinadas listas de reputación, pero las listas externas pueden contener falsos positivos, retrasos o criterios distintos. Aparecer en una lista no implica por sí solo que la IP sea maliciosa.",
  },
  {
    q: "¿Por qué algunas listas aparecen como «sin respuesta»?",
    a: "Algunas listas limitan las consultas desde ciertos resolutores o pueden estar temporalmente no disponibles. En esos casos las marcamos aparte y no las contamos como «limpia», para no dar una imagen falsa de completitud.",
  },
  {
    q: "¿Puedo comprobar IPv6 o un dominio?",
    a: "Puedes introducir un dominio: lo resolvemos a su primera IPv4 pública y te indicamos qué IP se analiza. IPv6 aún no se admite porque la mayoría de listas de reputación no lo cubren de forma fiable.",
  },
  {
    q: "Mi IP aparece listada, ¿cómo la retiro?",
    a: "Cada lista tiene su propio procedimiento de retirada (delisting). Visita el sitio de la lista concreta, comprueba el motivo y sigue sus instrucciones. Corrige antes la causa (por ejemplo, un equipo comprometido o mala configuración de correo).",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Comprobar IP en listas negras", path: "/blacklist-checker" }]}>
      <WebApplicationJsonLd
        name="Blacklist Checker — IPLibre"
        description="Comprueba si una IP aparece en listas públicas de reputación (DNSBL)."
        path="/blacklist-checker"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Comprobar IP en listas negras"
        description="Consulta si una dirección IPv4 aparece en varias listas públicas de reputación (DNSBL) a la vez. Introduce una IP o un dominio."
      />
      <BlacklistChecker />

      <section className="prose mt-12 max-w-none">
        <h2>Cómo funciona</h2>
        <p>
          Consultamos varias listas de reputación DNSBL en paralelo (con concurrencia y tiempos de
          espera acotados). Para cada lista invertimos los octetos de la IP y consultamos el registro
          correspondiente: si la lista responde con una dirección <code>127.0.0.x</code>, la IP está
          listada; si responde que no existe, está limpia. Las listas que no responden se muestran por
          separado.
        </p>
        <p>
          Usamos lenguaje cuidadoso a propósito: una IP puede aparecer en una lista por muchos
          motivos, incluidos falsos positivos. La reputación de una IP es un indicio, no un veredicto
          definitivo sobre si es maliciosa.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/geolocalizar-ip", label: "Geolocalizar IP", description: "Ubicación aproximada de una IP" },
          { href: "/reverse-dns", label: "Reverse DNS", description: "Registro PTR de una IP" },
          { href: "/asn-lookup", label: "ASN Lookup", description: "Operador y prefijos de red" },
        ]}
      />
    </ToolPage>
  );
}
