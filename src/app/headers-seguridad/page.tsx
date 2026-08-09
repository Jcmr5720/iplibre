import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { SecurityHeaders } from "@/components/tools/SecurityHeaders";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Analizador de headers de seguridad HTTP",
  description:
    "Comprueba qué protecciones HTTP usa una web: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy y cabeceras Cross-Origin. Puntuación transparente.",
  path: "/headers-seguridad",
});

const faqs = [
  {
    q: "¿La puntuación es una auditoría de seguridad?",
    a: "No. Analiza únicamente la presencia y calidad básica de ciertos encabezados HTTP. No sustituye a una auditoría completa. La puntuación es orientativa y su cálculo es transparente: cada cabecera aporta un peso fijo.",
  },
  {
    q: "¿Por qué no penalizáis la falta de X-Frame-Options si hay CSP?",
    a: "Porque una CSP con frame-ancestors restrictivo cubre funcionalmente la misma protección contra clickjacking. Evaluamos con criterio técnico actual y no penalizamos mecanismos modernos que sustituyen a los antiguos.",
  },
  {
    q: "¿Encontrar unsafe-inline en la CSP significa que la web es vulnerable?",
    a: "No necesariamente. Es una observación que puede reducir la protección frente a XSS, pero no implica una vulnerabilidad por sí sola. Lo clasificamos como advertencia, no como error.",
  },
  {
    q: "¿Qué headers analizáis?",
    a: "Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy y las políticas Cross-Origin (COOP, CORP, COEP). También señalamos Server y X-Powered-By como información expuesta.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Headers de seguridad", path: "/headers-seguridad" }]}>
      <WebApplicationJsonLd
        name="Analizador de headers de seguridad — IPLibre"
        description="Comprueba qué protecciones HTTP utiliza una página web."
        path="/headers-seguridad"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Analizar headers de seguridad"
        description="Comprueba qué protecciones HTTP utiliza una página web y obtén una puntuación orientativa y transparente, con recomendaciones para cada cabecera."
      />
      <SecurityHeaders />

      <section className="prose mt-12 max-w-none">
        <h2>Cómo interpretar la puntuación</h2>
        <p>
          Cada cabecera suma un peso fijo hasta 100 puntos:{" "}
          <strong>90–100 Excelente</strong>, <strong>75–89 Buena</strong>,{" "}
          <strong>50–74 Mejorable</strong> y <strong>0–49 Débil</strong>. Es una guía para priorizar
          mejoras, no una certificación de seguridad.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/ssl-checker", label: "SSL Checker", description: "Certificado HTTPS del dominio" },
          { href: "/estado-web", label: "Estado web", description: "¿La página responde?" },
          { href: "/dns-lookup", label: "DNS Lookup", description: "Registros DNS del dominio" },
          { href: "/analizar-virus", label: "Analizar virus", description: "Analisis local de archivos sospechosos" },
        ]}
      />
    </ToolPage>
  );
}
