import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type DonateButtonProps = {
  className?: string;
  onClick?: () => void;
  /** "compact" para el header, "block" para el menú móvil desplegado. */
  variant?: "compact" | "block";
};

// Botón de donación con tratamiento de contorno para no competir con los CTA del
// header. Usa tokens de marca de IPLibre (theme-aware).
export function DonateButton({ className, onClick, variant = "compact" }: DonateButtonProps) {
  return (
    <Link
      href="/donar"
      onClick={onClick}
      aria-label="Donar a IPLibre"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        variant === "compact" ? "px-3 py-2 text-sm" : "w-full px-4 py-3 text-sm",
        className,
      )}
    >
      <Heart className="h-4 w-4" aria-hidden />
      Donar
    </Link>
  );
}
