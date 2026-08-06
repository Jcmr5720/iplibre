import { ExternalLink } from "lucide-react";

/**
 * Localizador aproximado autocontenido (sin tiles externos, compatible con CSP).
 * Proyección equirectangular: sitúa un marcador según lat/lng sobre una
 * retícula. Para el mapa detallado se enlaza a OpenStreetMap.
 */
export function MiniMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Equirectangular: x = (lng+180)/360, y = (90-lat)/180
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=8/${lat}/${lng}`;

  return (
    <figure className="overflow-hidden rounded-lg border border-border">
      <div
        className="relative aspect-[2/1] w-full"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #0b2233 0%, #071726 55%, #050f1a 100%)",
        }}
        role="img"
        aria-label={`Ubicación aproximada${label ? ` en ${label}` : ""}: latitud ${lat.toFixed(2)}, longitud ${lng.toFixed(2)}`}
      >
        {/* Retícula */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={`${i * 10}%`}
              y1="0"
              x2={`${i * 10}%`}
              y2="100%"
              stroke="#1f3a52"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={`${i * 20}%`}
              x2="100%"
              y2={`${i * 20}%`}
              stroke="#1f3a52"
              strokeWidth="0.5"
            />
          ))}
          {/* Ecuador y meridiano de Greenwich */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#2b5a7a" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#2b5a7a" strokeWidth="1" />
        </svg>
        {/* Marcador */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-cyan-400" />
          </span>
        </div>
      </div>
      <figcaption className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-xs text-muted-foreground">
        <span>
          Ubicación aproximada · {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
        <a
          href={osm}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Ver en OpenStreetMap
          <ExternalLink className="h-3 w-3" />
        </a>
      </figcaption>
    </figure>
  );
}
