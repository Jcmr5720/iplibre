import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Globe2,
  MapPin,
  Network,
  ScanSearch,
  Server,
  Stethoscope,
  Repeat,
} from "lucide-react";
import { tools } from "@/lib/config";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  "/mi-ip": Globe2,
  "/test-de-velocidad": Gauge,
  "/diagnostico-de-internet": Stethoscope,
  "/geolocalizar-ip": MapPin,
  "/whois": ScanSearch,
  "/dns-lookup": Server,
  "/propagacion-dns": Repeat,
  "/asn-lookup": Network,
  "/reverse-dns": Server,
};

export function ToolsGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {tools.map((tool) => {
        const Icon = ICONS[tool.href] ?? Globe2;
        return (
          <Link
            key={tool.href}
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
      })}
    </div>
  );
}
