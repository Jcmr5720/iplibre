import { learnLinks, tools, type NavItem } from "@/lib/config";

export type RouteKind = "home" | "hub" | "tool" | "landing" | "resource" | "legal" | "support";

export type PublicRoute = {
  path: string;
  kind: RouteKind;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

export const hubRoutes: PublicRoute[] = [
  { path: "", kind: "home", changeFrequency: "daily", priority: 1 },
  { path: "/herramientas", kind: "hub", changeFrequency: "weekly", priority: 0.8 },
  { path: "/preguntas-frecuentes", kind: "hub", changeFrequency: "monthly", priority: 0.5 },
];

export const landingRoutes: PublicRoute[] = [
  { path: "/cual-es-mi-ip", kind: "landing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/medir-velocidad-internet", kind: "landing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/test-de-velocidad-wifi", kind: "landing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/comprobar-dns", kind: "landing", changeFrequency: "weekly", priority: 0.8 },
];

export const legalRoutes: PublicRoute[] = [
  { path: "/terminos", kind: "legal", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacidad", kind: "legal", changeFrequency: "monthly", priority: 0.4 },
  { path: "/cookies", kind: "legal", changeFrequency: "monthly", priority: 0.4 },
  { path: "/aviso-legal", kind: "legal", changeFrequency: "monthly", priority: 0.4 },
];

export const supportRoutes: PublicRoute[] = [
  { path: "/acerca-de", kind: "support", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contacto", kind: "support", changeFrequency: "monthly", priority: 0.4 },
  { path: "/donar", kind: "support", changeFrequency: "monthly", priority: 0.4 },
];

export const toolRoutes: PublicRoute[] = tools.map((tool) => ({
  path: tool.href,
  kind: "tool",
  changeFrequency: "weekly",
  priority: 0.8,
}));

export const resourceRoutes: PublicRoute[] = learnLinks
  .filter((link) => link.href !== "/preguntas-frecuentes")
  .map((link) => ({
    path: link.href,
    kind: "resource",
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

export const indexableRoutes: PublicRoute[] = [
  ...hubRoutes,
  ...toolRoutes,
  ...landingRoutes,
  ...resourceRoutes,
  ...supportRoutes,
  ...legalRoutes,
];

export const nonIndexableRoutes = ["/donar/exito"] as const;

export function toolByPath(path: string): NavItem | undefined {
  return tools.find((tool) => tool.href === path);
}
