/** Punto de extension deliberadamente inactivo: el analisis local no depende de terceros. */
export interface FileReputationProvider {
  readonly name: string;
  lookupSha256(hash: string, signal?: AbortSignal): Promise<{ known: boolean; label?: string }>;
}

