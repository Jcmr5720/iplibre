import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name} — ${siteConfig.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #060b16 0%, #0b1b2e 55%, #0e3a4a 100%)",
          color: "#e6edf6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="44" height="44" rx="12" fill="#0d1626" />
            <g stroke="url(#g)" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="35" x2="24" y2="13" />
              <line x1="36" y1="35" x2="24" y2="13" />
              <line x1="12" y1="35" x2="36" y2="35" />
            </g>
            <circle cx="12" cy="35" r="4.2" fill="#22d3ee" />
            <circle cx="36" cy="35" r="4.2" fill="#60a5fa" />
            <path
              d="M24 8.5c3.2 0 5.8 2.6 5.8 5.8 0 3.9-5.8 9.2-5.8 9.2s-5.8-5.3-5.8-9.2c0-3.2 2.6-5.8 5.8-5.8Z"
              fill="url(#g)"
            />
            <circle cx="24" cy="14.2" r="2.3" fill="#0d1626" />
          </svg>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
            <span>IP</span>
            <span style={{ color: "#38bdf8" }}>Libre</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 960 }}>
            Descubre tu IP y mide la velocidad de tu Internet
          </div>
          <div style={{ fontSize: 30, color: "#93a4bd", maxWidth: 900 }}>
            IP · Test de velocidad · DNS · WHOIS/RDAP · ASN · Geolocalización
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 26, color: "#22d3ee", fontWeight: 600 }}>
          Diagnóstico de Internet gratuito
        </div>
      </div>
    ),
    { ...size },
  );
}
