import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tools, toolCategories, type NavItem } from "@/lib/config";
import { TOOL_ICONS, FALLBACK_TOOL_ICON } from "@/components/nav/toolIcons";
import { cn } from "@/lib/utils";

function ToolCard({ tool }: { tool: NavItem }) {
  const Icon = TOOL_ICONS[tool.href] ?? FALLBACK_TOOL_ICON;
  return (
    <Link
      href={tool.href}
      className="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="flex items-center gap-1 text-base font-semibold">
        {tool.label}
        <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
    </Link>
  );
}

export function ToolsGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {tools.map((tool) => (
        <ToolCard key={tool.href} tool={tool} />
      ))}
    </div>
  );
}

/** Variante agrupada por categoría, para la página de catálogo. */
export function ToolsByCategory() {
  return (
    <div className="space-y-10">
      {toolCategories.map((cat) => (
        <section key={cat.id}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{cat.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((tool) => (
              <ToolCard key={tool.href} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
