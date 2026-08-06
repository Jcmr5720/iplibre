import * as React from "react";
import { ToolPage, PageHeader } from "@/components/layout/PageShell";

export function LegalLayout({
  title,
  breadcrumbLabel,
  path,
  updated,
  intro,
  children,
}: {
  title: string;
  breadcrumbLabel: string;
  path: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <ToolPage breadcrumbs={[{ name: breadcrumbLabel, path }]}>
      <PageHeader title={title} description={intro} />
      <p className="mb-6 text-sm text-muted-foreground">Última actualización: {updated}</p>
      <article className="prose">{children}</article>
    </ToolPage>
  );
}
