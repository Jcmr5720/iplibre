import type { Metadata } from "next";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { PasswordGenerator } from "@/components/tools/PasswordGenerator";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Generador de contraseñas seguras online | IPLibre",
  description:
    "Genera contraseñas aleatorias y seguras directamente en tu navegador, con crypto.getRandomValues. Sin guardar ni enviar tus contraseñas. Elige longitud, mayúsculas, números y símbolos.",
  path: "/generador-contrasenas",
});

const faqs = [
  {
    q: "¿Es seguro generar contraseñas en esta página?",
    a: "Sí. Todo el proceso ocurre en tu navegador usando crypto.getRandomValues(), la fuente de aleatoriedad criptográfica del sistema. Las contraseñas no se envían a ningún servidor, no se registran en analítica ni se guardan en el navegador.",
  },
  {
    q: "¿Qué longitud debería tener una contraseña?",
    a: "Para cuentas importantes, 16 caracteres o más combinando mayúsculas, minúsculas, números y símbolos ofrece un margen muy amplio. Si un servicio no admite símbolos, compénsalo aumentando la longitud.",
  },
  {
    q: "¿Qué es la entropía de una contraseña?",
    a: "Es una medida en bits de cuántas combinaciones tendría que probar un atacante. Se estima como longitud × log₂(tamaño del alfabeto). Más bits significa más difícil de adivinar por fuerza bruta, pero es solo una estimación del azar del generador.",
  },
  {
    q: "¿Debo usar un gestor de contraseñas?",
    a: "Es muy recomendable. Un gestor permite usar una contraseña única y larga en cada servicio sin memorizarlas. Genera aquí la contraseña y guárdala en tu gestor; así no reutilizas claves entre sitios.",
  },
  {
    q: "¿Por qué excluir caracteres ambiguos?",
    a: "Caracteres como 0/O o l/1/I se confunden con facilidad al leerlos o transcribirlos. Excluirlos es útil si vas a escribir la contraseña a mano; para contraseñas que solo copiarás y pegarás no es necesario.",
  },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Generador de contraseñas", path: "/generador-contrasenas" }]}>
      <WebApplicationJsonLd
        name="Generador de contraseñas seguras — IPLibre"
        description="Genera contraseñas aleatorias y seguras en tu navegador, sin guardarlas ni enviarlas."
        path="/generador-contrasenas"
      />
      <FaqJsonLd items={faqs} />
      <PageHeader
        eyebrow="Herramienta"
        title="Generador de contraseñas seguras"
        description="Crea contraseñas aleatorias y robustas directamente en tu navegador. No se envían ni se guardan: se generan en tu dispositivo con aleatoriedad criptográfica."
      />
      <PasswordGenerator />

      <section className="prose mt-12 max-w-none">
        <h2>Por qué usar una contraseña única en cada servicio</h2>
        <p>
          La mayoría de los ataques a cuentas no «rompen» una contraseña: reutilizan credenciales
          filtradas de otro sitio (lo que se conoce como <em>credential stuffing</em>). Si usas la
          misma clave en varios servicios, una sola filtración compromete todas tus cuentas. Con una
          contraseña distinta en cada sitio, una filtración queda contenida.
        </p>

        <h2>Qué longitud utilizar</h2>
        <p>
          La longitud es el factor que más aporta a la resistencia. Una contraseña de 16 caracteres
          con varios tipos de carácter es adecuada para la mayoría de cuentas; para lo más sensible
          (correo principal, banca, gestor de contraseñas) usa 20 o más. Si un servicio limita la
          longitud o los símbolos, ajústalo aquí y compénsalo alargando la contraseña.
        </p>

        <h2>Qué es la entropía</h2>
        <p>
          La entropía estima, en bits, el número de intentos que necesitaría un atacante para dar con
          la contraseña por fuerza bruta. Se calcula como{" "}
          <strong>longitud × log₂(tamaño del alfabeto)</strong>. Por ejemplo, 12 caracteres sobre un
          alfabeto de 94 símbolos imprimibles rondan los 78 bits. Es una guía útil, pero orientativa:
          no mide si la contraseña se ha reutilizado, filtrado o guardado de forma insegura.
        </p>

        <h2>Gestores de contraseñas</h2>
        <p>
          Un gestor de contraseñas guarda de forma cifrada una clave larga y única por servicio, de
          modo que solo memorizas una contraseña maestra. Combínalo con verificación en dos pasos
          (2FA) siempre que sea posible: aunque una contraseña se filtre, el segundo factor añade una
          barrera adicional.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
        <Faq items={faqs} />
      </section>

      <RelatedLinks
        links={[
          { href: "/headers-seguridad", label: "Headers de seguridad", description: "Protecciones HTTP de una web" },
          { href: "/ssl-checker", label: "SSL Checker", description: "Comprueba el certificado HTTPS" },
          { href: "/webrtc-leak-test", label: "WebRTC Leak Test", description: "¿Tu navegador filtra tu IP?" },
        ]}
      />
    </ToolPage>
  );
}
