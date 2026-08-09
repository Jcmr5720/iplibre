import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Faq } from "@/components/content/Faq";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";
import { FaqJsonLd, WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { VirusAnalyzer } from "@/components/tools/VirusAnalyzer";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Analizar virus en archivos con analisis local | IPLibre",
  description: "Analiza un archivo sospechoso directamente en tu navegador. Detecta formatos e indicadores de riesgo con privacidad: el archivo no se sube a IPLibre.",
  path: "/analizar-virus",
});

const faqs = [
  { q: "¿El archivo se sube a Internet?", a: "No. El archivo se lee y analiza localmente en tu navegador mediante un Web Worker. IPLibre no recibe su nombre, contenido, hash ni resultado, y no guarda historial por defecto." },
  { q: "¿Puede IPLibre confirmar que un archivo no tiene virus?", a: "No. El analisis estatico busca indicadores de riesgo, pero no ejecuta el archivo, no usa una base completa de firmas y no sustituye un antivirus con proteccion en tiempo real y analisis dinamico." },
  { q: "¿Que archivos puedo analizar?", a: "La deteccion cubre imagenes PNG y JPEG, texto, scripts, PDF, ejecutables PE de Windows, ZIP, documentos Office Open XML y reconoce parcialmente Office antiguo, RAR, 7Z, GZIP, TAR y ELF." },
  { q: "¿Que significa Sin indicadores evidentes?", a: "Significa que las comprobaciones disponibles no encontraron señales destacables. No equivale a archivo limpio ni garantiza seguridad: amenazas sofisticadas pueden no dejar señales estaticas." },
  { q: "¿Que hago si aparece riesgo alto?", a: "No abras ni ejecutes el archivo. Confirma el remitente, elimina copias inesperadas y analizalo con una solucion antivirus completa y actualizada antes de decidir que hacer." },
  { q: "¿Por que un archivo legitimo puede mostrar indicadores?", a: "Compresion, cifrado, macros, scripts administrativos o instaladores pueden compartir caracteristicas con archivos maliciosos. Por eso cada indicador explica la evidencia y el resultado se presenta como riesgo, no como diagnostico definitivo." },
];

export default function Page() {
  return (
    <ToolPage breadcrumbs={[{ name: "Analizar virus", path: "/analizar-virus" }]}>
      <WebApplicationJsonLd name="Analizar virus en archivos — IPLibre" description="Analizador estatico local de archivos sospechosos que identifica formatos e indicadores de riesgo sin subir el archivo." path="/analizar-virus" />
      <FaqJsonLd items={faqs} />
      <PageHeader eyebrow="Seguridad · Analisis local" title="Analizar virus en un archivo" description="Comprueba un archivo sospechoso directamente en tu navegador. Identificamos el formato real, calculamos su SHA-256 y buscamos indicadores de riesgo sin subir el archivo." >
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium"><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Tu archivo se analiza en tu dispositivo</span><span className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">Sin registro · Sin historial</span></div>
      </PageHeader>

      <VirusAnalyzer />

      <div className="prose mt-12 max-w-none">
        <h2>¿Como funciona el analisis?</h2>
        <p>IPLibre lee los bytes del archivo dentro del navegador, comprueba sus cabeceras y estructura, calcula SHA-256 mediante Web Crypto y aplica detectores especificos. El trabajo intensivo ocurre en un Web Worker para mantener la interfaz disponible. El archivo nunca se ejecuta.</p>

        <h2>¿El archivo se sube a Internet?</h2>
        <p>No. La herramienta no contiene una ruta de subida ni consulta una API de reputacion. El archivo, su nombre, su contenido, su hash y el resultado permanecen en la sesion del navegador y desaparecen al recargar. IPLibre tampoco los guarda en localStorage.</p>

        <h2>¿Que puede detectar IPLibre?</h2>
        <p>El motor compara la extension con el formato real, detecta dobles extensiones, ejecutables incrustados, entropia alta y estructuras inconsistentes. Tambien revisa señales propias de ejecutables PE, scripts, PDF, ZIP y documentos Office modernos.</p>
        <ul><li>En scripts combina ofuscacion, comandos codificados, descargas, ejecucion dinamica y persistencia.</li><li>En PDF busca JavaScript, acciones automaticas, lanzamientos, adjuntos, formularios, enlaces y cifrado.</li><li>En Office detecta macros, objetos incrustados y relaciones externas cuando son visibles en la estructura ZIP.</li><li>En ZIP inspecciona el directorio sin extraer archivos y aplica limites contra bombas de descompresion.</li></ul>

        <h2>¿Que no puede detectar?</h2>
        <p>El analisis es estatico: no observa el comportamiento que tendria el archivo al ejecutarse, no emula un sistema operativo y no compara contra una base antivirus completa. Un malware sofisticado puede no mostrar indicadores evidentes, y un archivo legitimo puede activar heuristicas.</p>

        <h2>¿Que significa el nivel de riesgo?</h2>
        <p>Cada indicador suma un peso centralizado segun su relevancia. De 0 a 19 se muestra «Sin indicadores evidentes»; de 20 a 39, «Precaucion»; de 40 a 69, «Riesgo elevado»; y de 70 a 100, «Riesgo alto». Una señal menor aislada no produce por si sola el nivel maximo.</p>

        <h2>¿Que archivos puedo analizar?</h2>
        <p>Hay analisis profundo para PDF, PE de Windows, scripts, ZIP y Office Open XML, ademas de comprobaciones generales para texto e imagenes. RAR, 7Z, TAR, GZIP, ELF y Office antiguo se reconocen con analisis parcial. El limite actual es 64 MiB por archivo.</p>

        <h2>¿Que hago si aparece riesgo alto?</h2>
        <p>No abras ni ejecutes el archivo para «probarlo». Confirma si esperabas recibirlo, verifica el canal y utiliza una solucion antivirus completa y actualizada. Si el origen es dudoso, elimina el archivo.</p>

        <h2>¿Sustituye un antivirus?</h2>
        <p>No. IPLibre aporta una primera revision privada y explicable. Un antivirus completo combina firmas, reputacion, comportamiento, aislamiento y proteccion continua que un analizador estatico en el navegador no puede ofrecer.</p>
      </div>

      <section className="mt-10"><h2 className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2><Faq items={faqs} /></section>
      <RelatedLinks title="Herramientas de seguridad relacionadas" links={[{ href: "/webrtc-leak-test", label: "WebRTC Leak Test", description: "Comprueba posibles fugas de IP del navegador" }, { href: "/headers-seguridad", label: "Headers de seguridad", description: "Revisa protecciones HTTP de un sitio" }, { href: "/mi-ip", label: "Mi IP", description: "Consulta la direccion publica de tu conexion" }]} />
    </ToolPage>
  );
}

