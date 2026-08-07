import type { Metadata } from "next";
import Link from "next/link";
import { LearnLayout } from "@/components/content/LearnLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "¿Qué es el jitter? — La estabilidad de tu conexión, explicada",
  description:
    "Qué es el jitter, por qué provoca cortes en videollamadas, streaming y juegos, qué valores son buenos y cómo reducirlo. La variación de la latencia, en claro.",
  path: "/que-es-el-jitter",
});

export default function Page() {
  return (
    <LearnLayout
      title="¿Qué es el jitter?"
      breadcrumbLabel="¿Qué es el jitter?"
      path="/que-es-el-jitter"
      intro="El jitter es la variación de la latencia entre mediciones consecutivas. Un jitter bajo significa una conexión estable; uno alto provoca cortes y tirones aunque tu velocidad sea buena."
      faqs={[
        {
          q: "¿Qué valor de jitter es bueno?",
          a: "Por debajo de 10 ms es excelente y no se nota. Entre 10 y 30 ms es aceptable. Por encima de 30 ms empiezan los cortes en videollamadas y el lag irregular en juegos.",
        },
        {
          q: "Tengo buena velocidad pero las videollamadas se cortan, ¿por qué?",
          a: "Suele ser jitter alto o pérdida de paquetes, no falta de Mbps. Si la latencia sube y baja constantemente, el audio y el vídeo llegan a destiempo y se producen cortes.",
        },
        {
          q: "¿Cómo puedo reducir el jitter?",
          a: "Usa cable en lugar de Wi-Fi si puedes, evita saturar la línea con descargas simultáneas, acerca los dispositivos al router y prioriza la banda de 5 GHz. En redes móviles y satélite el jitter suele ser mayor por naturaleza.",
        },
      ]}
      related={[
        { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide tu jitter ahora" },
        { href: "/que-es-el-ping", label: "¿Qué es el ping?", description: "La latencia, explicada" },
        { href: "/test-de-velocidad-wifi", label: "Test de velocidad Wi-Fi", description: "Diagnostica tu inalámbrica" },
        { href: "/diagnostico-de-internet", label: "Diagnóstico de Internet", description: "Chequeo integral" },
      ]}
    >
      <h2>Cuando lo importante no es la media, sino la constancia</h2>
      <p>
        Imagina que mides el <Link href="/que-es-el-ping">ping</Link> diez veces seguidas. Si todas
        rondan los 20 ms, tu conexión es estable. Si saltan entre 15 y 90 ms, la media puede parecer
        buena, pero la experiencia real será mala: eso es el <strong>jitter</strong>, la variación
        entre una medición y la siguiente.
      </p>

      <h2>Por qué el jitter arruina las videollamadas y los juegos</h2>
      <p>
        El audio y el vídeo en tiempo real esperan que los datos lleguen a un ritmo constante. Cuando
        el jitter es alto, unos paquetes llegan pronto y otros tarde; el reproductor tiene que
        esperarlos o descartarlos, y aparecen los cortes, el sonido metálico y los tirones. En los
        juegos, provoca ese <em>lag</em> irregular que aparece justo en el peor momento.
      </p>

      <h2>Qué lo causa</h2>
      <ul>
        <li><strong>Wi-Fi con interferencias</strong> o señal débil.</li>
        <li><strong>Saturación de la red:</strong> varias descargas o streams a la vez.</li>
        <li><strong>Enlaces inestables:</strong> redes móviles, satélite o cableado defectuoso.</li>
        <li><strong>Rutas congestionadas</strong> entre tú y el servidor.</li>
      </ul>
      <p>
        Puedes medir tu jitter, junto con la descarga, la subida y el ping, en el{" "}
        <Link href="/test-de-velocidad">test de velocidad</Link>. Si sospechas de tu red
        inalámbrica, prueba también el{" "}
        <Link href="/test-de-velocidad-wifi">test de velocidad Wi-Fi</Link>.
      </p>
    </LearnLayout>
  );
}
