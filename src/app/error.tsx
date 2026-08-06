"use client";

import * as React from "react";
import { RotateCcw, Home } from "lucide-react";
import { Container } from "@/components/layout/PageShell";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Registro mínimo en cliente; no exponemos detalles internos al usuario.
    console.error("Error de aplicación:", error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <p className="brand-gradient-text text-6xl font-black">¡Vaya!</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Algo no ha ido bien</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Se ha producido un error inesperado. Puedes reintentar la acción o volver al inicio. Si el
        problema persiste, vuelve a intentarlo más tarde.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Referencia: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reintentar
        </Button>
        <ButtonLink href="/" variant="outline">
          <Home className="h-4 w-4" /> Ir al inicio
        </ButtonLink>
      </div>
    </Container>
  );
}
