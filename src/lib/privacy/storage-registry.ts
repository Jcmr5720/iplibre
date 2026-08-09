export type PrivacyCategory = "necessary" | "preferences" | "analytics" | "marketing";

export type StorageTechnologyType =
  | "localStorage"
  | "third-party script"
  | "third-party checkout"
  | "server-side service";

export type StorageRegistryEntry = {
  name: string;
  provider: string;
  type: StorageTechnologyType;
  purpose: string;
  category: PrivacyCategory;
  duration: string;
  beforeConsent: boolean;
  routes: string;
  removal: string;
  keys?: string[];
};

export const PRIVACY_CONSENT_VERSION = 1;
export const PRIVACY_CONSENT_KEY = "iplibre_privacy_consent";
export const PRIVACY_CONSENT_DURATION_DAYS = 180;

export const SPEED_HISTORY_KEY = "iplibre:speed-history:v1";
export const THEME_STORAGE_KEY = "theme";

export const privacyCategories: Record<
  PrivacyCategory,
  { label: string; description: string; required: boolean }
> = {
  necessary: {
    label: "Necesarias",
    description:
      "Imprescindibles para seguridad, funcionamiento básico, límites antiabuso y para recordar la propia decisión de consentimiento.",
    required: true,
  },
  preferences: {
    label: "Preferencias",
    description:
      "Guardan elecciones locales como tema claro/oscuro y el historial local del test de velocidad.",
    required: false,
  },
  analytics: {
    label: "Analítica",
    description:
      "Medición agregada de uso y rendimiento con Vercel Analytics y Speed Insights, sin Google Analytics ni píxeles de marketing.",
    required: false,
  },
  marketing: {
    label: "Publicidad / marketing",
    description:
      "Reservada para AdSense y tecnologías publicitarias. Actualmente solo se carga si das consentimiento local.",
    required: false,
  },
};

export const storageRegistry: StorageRegistryEntry[] = [
  {
    name: PRIVACY_CONSENT_KEY,
    provider: "IPLibre",
    type: "localStorage",
    purpose:
      "Guardar la decisión de consentimiento, versión, categorías seleccionadas y fecha para no preguntar en cada visita.",
    category: "necessary",
    duration: `${PRIVACY_CONSENT_DURATION_DAYS} días o hasta que el usuario borre los datos del sitio.`,
    beforeConsent: true,
    routes: "Todo el sitio",
    removal:
      "Desde Preferencias de privacidad o borrando los datos del sitio en el navegador.",
    keys: [PRIVACY_CONSENT_KEY],
  },
  {
    name: THEME_STORAGE_KEY,
    provider: "IPLibre / next-themes",
    type: "localStorage",
    purpose: "Recordar la preferencia de tema claro, oscuro o sistema.",
    category: "preferences",
    duration: "Hasta retirar consentimiento, cambiar preferencia o borrar datos del navegador.",
    beforeConsent: false,
    routes: "Todo el sitio",
    removal:
      "Desactivar Preferencias en el panel de privacidad elimina la clave conocida de tema.",
    keys: [THEME_STORAGE_KEY],
  },
  {
    name: SPEED_HISTORY_KEY,
    provider: "IPLibre",
    type: "localStorage",
    purpose:
      "Guardar en este navegador hasta 50 resultados del test de velocidad: descarga, subida, latencia, jitter, duración, proveedor, tipo de conexión, fecha, ID local e ISP si está disponible.",
    category: "preferences",
    duration:
      "Hasta 50 entradas, hasta que el usuario borre el historial, retire Preferencias o borre datos del navegador.",
    beforeConsent: false,
    routes: "/test-de-velocidad",
    removal:
      "Botón Borrar historial en la herramienta o desactivar Preferencias en el panel de privacidad.",
    keys: [SPEED_HISTORY_KEY],
  },
  {
    name: "Vercel Web Analytics",
    provider: "Vercel",
    type: "third-party script",
    purpose: "Métricas agregadas de visitas y páginas para entender uso general del sitio.",
    category: "analytics",
    duration:
      "Según la configuración de Vercel; IPLibre no crea cookies propias para esta medición.",
    beforeConsent: false,
    routes: "Todo el sitio",
    removal: "Desactivar Analítica impide cargas futuras desde IPLibre.",
  },
  {
    name: "Vercel Speed Insights",
    provider: "Vercel",
    type: "third-party script",
    purpose: "Métricas agregadas de rendimiento web real, como Core Web Vitals.",
    category: "analytics",
    duration:
      "Según la configuración de Vercel; IPLibre no crea cookies propias para esta medición.",
    beforeConsent: false,
    routes: "Todo el sitio",
    removal: "Desactivar Analítica impide cargas futuras desde IPLibre.",
  },
  {
    name: "Google AdSense",
    provider: "Google",
    type: "third-party script",
    purpose:
      "Script de AdSense asociado a la cuenta del sitio. No hay slots de anuncios en el código auditado; queda preparado para publicidad futura.",
    category: "marketing",
    duration:
      "Google puede usar cookies o tecnologías similares si se carga el script y hay anuncios/CMP aplicables.",
    beforeConsent: false,
    routes: "Todo el sitio",
    removal:
      "Desactivar Publicidad impide cargas futuras del script desde IPLibre. Las cookies de Google existentes deben gestionarse desde el navegador o controles de Google.",
  },
  {
    name: "Mercado Pago Checkout",
    provider: "Mercado Pago",
    type: "third-party checkout",
    purpose:
      "Procesar aportes voluntarios cuando el usuario pulsa Continuar al pago en /donar.",
    category: "necessary",
    duration: "Según Mercado Pago; solo interviene al iniciar un aporte.",
    beforeConsent: true,
    routes: "/donar",
    removal: "Gestionar datos con Mercado Pago o borrar datos del sitio de Mercado Pago.",
  },
  {
    name: "Resend",
    provider: "Resend",
    type: "server-side service",
    purpose:
      "Enviar mensajes del formulario de contacto desde el servidor cuando el usuario lo solicita.",
    category: "necessary",
    duration: "No escribe almacenamiento en el navegador desde IPLibre.",
    beforeConsent: true,
    routes: "/contacto",
    removal: "No aplica en navegador; el tratamiento corresponde al envío solicitado.",
  },
];

export function entriesByCategory(category: PrivacyCategory): StorageRegistryEntry[] {
  return storageRegistry.filter((entry) => entry.category === category);
}

export function keysForCategory(category: PrivacyCategory): string[] {
  return storageRegistry
    .filter((entry) => entry.category === category)
    .flatMap((entry) => entry.keys ?? []);
}
