import { cn } from "@/lib/utils";

/**
 * Isotipo original de IPLibre.
 * Concepto: nodos de una red conectados que ascienden formando una flecha
 * (velocidad), con un punto-vértice superior que evoca un marcador de
 * ubicación/dirección IP. Sin relación visual con marcas de terceros.
 */
export function LogoMark({ className, title = "IPLibre" }: { className?: string; title?: string }) {
  const gid = "iplibre-grad";
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--brand-1)" />
          <stop offset="1" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#iplibre-grad)" opacity="0.12" />
      {/* Conexiones */}
      <g stroke="url(#iplibre-grad)" strokeWidth="2.4" strokeLinecap="round">
        <line x1="12" y1="35" x2="24" y2="13" />
        <line x1="36" y1="35" x2="24" y2="13" />
        <line x1="12" y1="35" x2="36" y2="35" />
      </g>
      {/* Nodos */}
      <circle cx="12" cy="35" r="4.2" fill="var(--brand-1)" />
      <circle cx="36" cy="35" r="4.2" fill="var(--brand-2)" />
      {/* Vértice superior con forma de marcador */}
      <path
        d="M24 8.5c3.2 0 5.8 2.6 5.8 5.8 0 3.9-5.8 9.2-5.8 9.2s-5.8-5.3-5.8-9.2c0-3.2 2.6-5.8 5.8-5.8Z"
        fill="url(#iplibre-grad)"
      />
      <circle cx="24" cy="14.2" r="2.3" fill="var(--card)" />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          <span className="text-foreground">IP</span>
          <span className="brand-gradient-text">Libre</span>
        </span>
      )}
    </span>
  );
}
