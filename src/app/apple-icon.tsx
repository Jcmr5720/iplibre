import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060b16",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
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
          <circle cx="24" cy="14.2" r="2.3" fill="#060b16" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
