import type { Metadata } from "next";
import Link from "next/link";
import { LearnLayout } from "@/components/content/LearnLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "¿Qué es el ping? — Latencia y por qué importa en tu conexión",
  description:
    "Qué es el ping o latencia, cómo se mide en milisegundos, qué valores son buenos para juegos y videollamadas, y por qué un ping bajo importa más que muchos Mbps.",
  path: "/que-es-el-ping",
});

export default function Page() {
  return (
    <LearnLayout
      title="¿Qué es el ping?"
      breadcrumbLabel="¿Qué es el ping?"
      path="/que-es-el-ping"
      intro="El ping —o latencia— es el tiempo que tarda un dato en ir hasta un servidor y volver, medido en milisegundos. Cuanto más bajo, más reactiva se siente tu conexión."
      faqs={[
        {
          q: "¿Qué ping se considera bueno?",
          a: "Por debajo de 30 ms es excelente; entre 30 y 60 ms es bueno; entre 60 y 100 ms es aceptable para navegar. Por encima de 100 ms se nota en juegos en línea y videollamadas.",
        },
        {
          q: "¿Por qué tengo mucho ancho de banda pero el juego va con retraso?",
          a: "Porque la velocidad (Mbps) y la latencia (ms) son cosas distintas. Puedes tener 600 Mbps y aun así un ping alto o inestable. Para gaming y videollamadas, la latencia y el jitter importan más que los Mbps.",
        },
        {
          q: "¿El ping del navegador es igual al ping ICMP?",
          a: "No exactamente. En un navegador no se puede enviar ping ICMP, así que medimos el tiempo de ida y vuelta de una petición HTTPS. Es una aproximación fiable de la latencia real, y lo indicamos con su nombre técnico correcto.",
        },
      ]}
      related={[
        { href: "/test-de-velocidad", label: "Test de velocidad", description: "Mide tu ping ahora" },
        { href: "/que-es-el-jitter", label: "¿Qué es el jitter?", description: "La variación del ping" },
        { href: "/test-de-velocidad-wifi", label: "Test de velocidad Wi-Fi", description: "Diagnostica tu inalámbrica" },
        { href: "/diagnostico-de-internet", label: "Diagnóstico de Internet", description: "Chequeo integral" },
      ]}
    >
      <h2>Latencia: el tiempo de reacción de tu conexión</h2>
      <p>
        Mientras la velocidad mide <em>cuántos</em> datos caben por segundo, el ping mide{" "}
        <em>cuánto tardan</em> en llegar. Es el tiempo de ida y vuelta de una pequeña petición: si es
        de 20 ms, cada instrucción que envías tarda una fracción de segundo en obtener respuesta. En
        una videollamada o una partida en línea, esa fracción marca la diferencia entre algo fluido y
        algo que se siente con retraso.
      </p>

      <h2>Qué influye en el ping</h2>
      <ul>
        <li><strong>La distancia al servidor:</strong> más lejos, más milisegundos.</li>
        <li><strong>El tipo de conexión:</strong> la fibra suele tener menos latencia que el móvil o el satélite.</li>
        <li><strong>El Wi-Fi:</strong> añade latencia y variabilidad frente al cable.</li>
        <li><strong>La saturación:</strong> muchas descargas a la vez disparan el ping.</li>
      </ul>

      <h2>Ping bajo frente a muchos Mbps</h2>
      <p>
        Es un error común fijarse solo en los Mbps. Para gaming competitivo, trading o
        videoconferencia, un <strong>ping bajo y estable</strong> importa más que un número enorme de
        descarga. La estabilidad de ese ping se llama <Link href="/que-es-el-jitter">jitter</Link>, y
        puedes medir ambos en el <Link href="/test-de-velocidad">test de velocidad</Link>.
      </p>
    </LearnLayout>
  );
}
