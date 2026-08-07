import * as React from "react";
import { cn } from "@/lib/utils";

export type BannerTone = "success" | "warning" | "danger" | "neutral";

const tones: Record<BannerTone, string> = {
  success: "border-success/30 bg-success-bg",
  warning: "border-warning/30 bg-warning-bg",
  danger: "border-danger/30 bg-danger-bg",
  neutral: "border-border bg-muted",
};

const dot: Record<BannerTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

/**
 * Banner de resultado destacado, compartido por las herramientas de sitios web
 * (estado, SSL, headers). Comunica el veredicto principal en segundos.
 */
export function ResultBanner({
  tone,
  label,
  detail,
  icon,
  aside,
  className,
}: {
  tone: BannerTone;
  label: string;
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
        tones[tone],
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-foreground" aria-hidden>
          {icon ?? <span className={cn("block h-3 w-3 rounded-full", dot[tone])} />}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">{label}</p>
          {detail && <p className="mt-0.5 text-sm text-foreground/80">{detail}</p>}
        </div>
      </div>
      {aside && <div className="shrink-0 sm:text-right">{aside}</div>}
    </div>
  );
}
