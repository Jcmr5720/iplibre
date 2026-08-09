import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/config";
import { indexableRoutes } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  return indexableRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
