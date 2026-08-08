import type { MetadataRoute } from "next";
import { getBaseUrl, tools, learnLinks } from "@/lib/config";

const staticPaths = [
  "",
  "/herramientas",
  "/preguntas-frecuentes",
  "/acerca-de",
  "/contacto",
  "/terminos",
  "/privacidad",
  "/cookies",
  "/aviso-legal",
  "/donar",
];

/**
 * Páginas de aterrizaje orientadas a intenciones de búsqueda que reutilizan los
 * motores de las herramientas. Excluye redirecciones (mi-ip-publica,
 * test-de-internet) para no listar URLs que devuelven 308.
 */
const landingPaths = [
  "/cual-es-mi-ip",
  "/medir-velocidad-internet",
  "/test-de-velocidad-wifi",
  "/comprobar-dns",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  const toolEntries = tools.map((t) => ({
    url: `${base}${t.href}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const landingEntries = landingPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Páginas informativas ("Aprender"), excluyendo /preguntas-frecuentes (ya en estáticas).
  const learnEntries = learnLinks
    .filter((l) => l.href !== "/preguntas-frecuentes")
    .map((l) => ({
      url: `${base}${l.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const staticEntries = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? ("daily" as const) : ("monthly" as const),
    priority: p === "" ? 1 : 0.5,
  }));

  return [...staticEntries, ...toolEntries, ...landingEntries, ...learnEntries];
}
