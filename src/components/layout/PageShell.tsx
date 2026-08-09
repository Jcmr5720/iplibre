import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";
import { toolByPath } from "@/lib/routes";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4", className)} {...props} />;
}

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Inicio", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Ruta de navegación" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.path} className="transition-colors hover:text-foreground">
                    {c.name}
                  </Link>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
      <BreadcrumbsJsonLd items={all} />
    </>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-base text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

export function ToolPage({
  breadcrumbs,
  children,
}: {
  breadcrumbs: Crumb[];
  children: React.ReactNode;
}) {
  const last = breadcrumbs[breadcrumbs.length - 1];
  const tool = last ? toolByPath(last.path) : undefined;
  const categoryName =
    tool?.category === "conexion"
      ? "Mi conexión"
      : tool?.category === "red"
        ? "Dominios y red"
        : tool?.category === "web"
          ? "Sitios web"
          : tool?.category === "seguridad"
            ? "Seguridad y utilidades"
            : undefined;
  const enhancedBreadcrumbs =
    tool && categoryName
      ? [
          { name: "Herramientas", path: "/herramientas" },
          { name: categoryName, path: `/herramientas#${tool.category}` },
          ...breadcrumbs,
        ]
      : breadcrumbs;
  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs items={enhancedBreadcrumbs} />
      {children}
    </Container>
  );
}
