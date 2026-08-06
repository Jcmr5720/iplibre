import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const config: Record<Tone, { className: string; Icon: React.ElementType }> = {
  info: { className: "bg-info-bg text-info border-info/30", Icon: Info },
  success: { className: "bg-success-bg text-success border-success/30", Icon: CheckCircle2 },
  warning: { className: "bg-warning-bg text-warning border-warning/30", Icon: AlertTriangle },
  danger: { className: "bg-danger-bg text-danger border-danger/30", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  role = "status",
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  const { className: toneClass, Icon } = config[tone];
  return (
    <div
      role={role}
      className={cn("flex gap-3 rounded-md border p-3.5 text-sm", toneClass, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && <div className="text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
