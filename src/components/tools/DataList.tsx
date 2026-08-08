import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";

export interface DataRow {
  label: string;
  value?: React.ReactNode;
  copyValue?: string;
  mono?: boolean;
  hint?: string;
}

/** Lista clave–valor accesible para mostrar resultados de las herramientas. */
export function DataList({ rows, className }: { rows: DataRow[]; className?: string }) {
  const visible = rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {visible.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="min-w-0 text-sm break-words text-muted-foreground sm:w-56 sm:shrink-0">
            {row.label}
            {row.hint && <span className="ml-1 text-xs opacity-70">({row.hint})</span>}
          </dt>
          <dd
            className={cn(
              "flex min-w-0 flex-1 items-center justify-end gap-2 break-words text-right text-sm font-medium text-foreground",
              row.mono && "font-mono",
            )}
          >
            <span className="min-w-0 break-all">{row.value}</span>
            {row.copyValue && <CopyButton value={row.copyValue} compact aria-label={`Copiar ${row.label}`} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
