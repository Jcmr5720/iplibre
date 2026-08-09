import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/content/LegalLayout";
import { PrivacyPreferencesButton } from "@/components/privacy/PrivacyPreferencesButton";
import {
  PRIVACY_CONSENT_DURATION_DAYS,
  privacyCategories,
  storageRegistry,
  type PrivacyCategory,
} from "@/lib/privacy/storage-registry";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Politica de cookies",
  description:
    "Inventario de cookies, localStorage, analitica, publicidad y preferencias de privacidad en IPLibre.",
  path: "/cookies",
});

const categoryOrder: PrivacyCategory[] = ["necessary", "preferences", "analytics", "marketing"];

export default function Page() {
  return (
    <LegalLayout
      title="Politica de cookies"
      breadcrumbLabel="Cookies"
      path="/cookies"
      updated="9 de agosto de 2026"
      intro="IPLibre usa un modelo de consentimiento por categorias y no activa tecnologias opcionales antes de que las aceptes."
    >
      <h2>Que son las cookies y tecnologias similares</h2>
      <p>
        Las cookies son pequenos datos que un sitio puede guardar en el navegador. Tambien existen
        tecnologias similares, como Local Storage, Session Storage, IndexedDB y Cache Storage, que
        permiten conservar preferencias, estados o archivos en el dispositivo. No todas son cookies,
        pero todas deben describirse con claridad cuando pueden guardar o leer informacion del
        navegador.
      </p>

      <h2>Resumen claro</h2>
      <p>
        IPLibre no usa Google Analytics ni pixeles de seguimiento. La decision de consentimiento se
        guarda localmente durante {PRIVACY_CONSENT_DURATION_DAYS} dias para no preguntarte en cada
        visita. Las preferencias, analitica de Vercel y AdSense solo se cargan si das permiso.
      </p>

      <h2>Que utiliza IPLibre</h2>
      <p>
        La auditoria de codigo encontro almacenamiento en Local Storage para la decision de
        consentimiento, el tema claro/oscuro y el historial local del test de velocidad. No encontro
        uso propio de cookies HTTP, Session Storage, IndexedDB, Cache Storage ni service workers.
      </p>

      <div className="not-prose my-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Cambiar tu decision</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes aceptar, rechazar o retirar categorias opcionales en cualquier momento.
        </p>
        <div className="mt-3">
          <PrivacyPreferencesButton />
        </div>
      </div>

      <h2>Categorias</h2>
      <ul>
        {categoryOrder.map((category) => (
          <li key={category}>
            <strong>{privacyCategories[category].label}:</strong>{" "}
            {privacyCategories[category].description}
          </li>
        ))}
      </ul>

      <h2>Inventario tecnico</h2>
      <p>
        Esta lista se genera desde el registro tecnico de privacidad usado por el codigo de IPLibre.
        Si se anade una tecnologia nueva, debe quedar registrada aqui y en las pruebas.
      </p>

      <div className="not-prose my-6 grid gap-3">
        {storageRegistry.map((entry) => (
          <article key={`${entry.provider}-${entry.name}`} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{entry.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {entry.provider} · {entry.type}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                {privacyCategories[entry.category].label}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground">Finalidad</dt>
                <dd className="mt-1 text-muted-foreground">{entry.purpose}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Duracion</dt>
                <dd className="mt-1 text-muted-foreground">{entry.duration}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Rutas</dt>
                <dd className="mt-1 text-muted-foreground">{entry.routes}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Antes del consentimiento</dt>
                <dd className="mt-1 text-muted-foreground">{entry.beforeConsent ? "Si" : "No"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-foreground">Retirada o borrado</dt>
                <dd className="mt-1 text-muted-foreground">{entry.removal}</dd>
              </div>
              {entry.keys?.length ? (
                <div className="sm:col-span-2">
                  <dt className="font-medium text-foreground">Claves locales</dt>
                  <dd className="mt-1 break-words font-mono text-xs text-muted-foreground">
                    {entry.keys.join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        ))}
      </div>

      <h2>Publicidad y AdSense</h2>
      <p>
        El sitio incluye la verificacion de cuenta de AdSense en la metadata, pero el script de
        AdSense no se carga hasta que aceptas la categoria Publicidad / marketing. En el codigo
        auditado no hay slots de anuncios renderizados.
      </p>

      <h2>Servicios externos necesarios</h2>
      <p>
        Algunas acciones solicitadas por ti pueden usar servicios externos: Mercado Pago para
        donaciones, Resend para contacto, resolutores DNS, RDAP/WHOIS, geolocalizacion IP y pruebas
        de red. Esos servicios no se activan por el banner, sino cuando usas voluntariamente la
        herramienta o formulario correspondiente. Puedes leer mas en la{" "}
        <Link href="/privacidad">politica de privacidad</Link>.
      </p>

      <h2>Como borrar datos del navegador</h2>
      <p>
        Puedes retirar categorias desde este panel o borrar los datos del sitio desde tu navegador.
        Si ya se hubiera cargado una tecnologia de terceros tras aceptar una categoria opcional,
        tambien puedes gestionar esos datos desde los controles del propio proveedor.
      </p>

      <h2>Contacto</h2>
      <p>
        Para dudas sobre esta politica, usa la <Link href="/contacto">pagina de contacto</Link> de
        IPLibre. No publicamos una direccion nueva aqui si no esta configurada oficialmente en el
        sitio.
      </p>
    </LegalLayout>
  );
}
