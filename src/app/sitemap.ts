import type { MetadataRoute } from "next";
import { getBaseUrl, tools } from "@/lib/config";

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

  const staticEntries = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? ("daily" as const) : ("monthly" as const),
    priority: p === "" ? 1 : 0.5,
  }));

  return [...staticEntries, ...toolEntries];
}
