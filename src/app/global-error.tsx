"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#060b16",
          color: "#e6edf6",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 480 }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Error del sistema</h1>
          <p style={{ color: "#93a4bd", marginBottom: 24 }}>
            Se ha producido un error grave. Intenta recargar la página.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(120deg, #06b6d4, #2563eb)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
