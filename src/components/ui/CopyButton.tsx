"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  className,
  toastMessage,
  compact = false,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  toastMessage?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  async function onCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (toastMessage) toast(toastMessage, "success");
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast("No se pudo copiar al portapapeles", "danger");
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted",
        className,
      )}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {!compact && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}
