import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/content";

/** Acordeón accesible basado en <details> nativo (funciona sin JavaScript). */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item) => (
        <details key={item.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {item.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
