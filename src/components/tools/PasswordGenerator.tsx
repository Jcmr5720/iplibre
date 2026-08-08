"use client";

import * as React from "react";
import { RefreshCw, Eye, EyeOff, Check, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard, cn } from "@/lib/utils";
import {
  PASSWORD_LIMITS,
  buildCharPools,
  estimateStrength,
  generatePassword,
  validateOptions,
  type PasswordOptions,
  type StrengthLevel,
} from "@/lib/security/password";

const CATEGORY_LABELS: { key: keyof PasswordOptions; label: string; hint: string }[] = [
  { key: "uppercase", label: "Mayúsculas", hint: "A-Z" },
  { key: "lowercase", label: "Minúsculas", hint: "a-z" },
  { key: "numbers", label: "Números", hint: "0-9" },
  { key: "symbols", label: "Símbolos", hint: "!@#$…" },
];

const STRENGTH_BAR: Record<StrengthLevel, string> = {
  weak: "bg-danger",
  fair: "bg-warning",
  strong: "bg-info",
  veryStrong: "bg-success",
};

const STRENGTH_TEXT: Record<StrengthLevel, string> = {
  weak: "text-danger",
  fair: "text-warning",
  strong: "text-info",
  veryStrong: "text-success",
};

const DEFAULTS: PasswordOptions = {
  length: PASSWORD_LIMITS.default,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export function PasswordGenerator() {
  const { toast } = useToast();
  const [opts, setOpts] = React.useState<PasswordOptions>(DEFAULTS);
  const [count, setCount] = React.useState(1);
  const [passwords, setPasswords] = React.useState<string[]>([]);
  const [reveal, setReveal] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const validation = validateOptions(opts);
  const strength = validation.ok ? estimateStrength(opts) : null;
  const alphabetSize = buildCharPools(opts).alphabet.length;

  const regenerate = React.useCallback(() => {
    const v = validateOptions(opts);
    if (!v.ok) {
      setError(v.error);
      setPasswords([]);
      return;
    }
    try {
      const next = Array.from({ length: count }, () => generatePassword(opts));
      setPasswords(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la contraseña.");
      setPasswords([]);
    }
  }, [opts, count]);

  // Genera una contraseña inicial tras el montaje (evita desajustes de hidratación
  // y garantiza que crypto.getRandomValues solo se usa en el cliente).
  React.useEffect(() => {
    regenerate();
    // Solo al montar; las regeneraciones posteriores son explícitas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    setOpts((prev) => ({ ...prev, [key]: value }));
  }

  async function onCopy(value: string, index: number) {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedIndex(index);
      toast("Contraseña copiada al portapapeles", "success");
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1800);
    } else {
      toast("No se pudo copiar al portapapeles", "danger");
    }
  }

  const primary = passwords[0] ?? "";

  return (
    <div className="space-y-6">
      {/* Resultado principal */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className="flex min-h-13 flex-1 items-center overflow-x-auto rounded-md border border-input bg-muted px-4 py-3"
              aria-live="polite"
            >
              <code className="font-mono text-lg break-all text-foreground sm:text-xl">
                {primary ? (reveal ? primary : "•".repeat(Math.min(primary.length, 40))) : "—"}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={!reveal}
                disabled={!primary}
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => primary && onCopy(primary, 0)}
                aria-label="Copiar contraseña"
                disabled={!primary}
              >
                {copiedIndex === 0 ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {strength && primary && (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fortaleza estimada</span>
                <span className={cn("font-semibold", STRENGTH_TEXT[strength.level])}>
                  {strength.label} · ~{strength.bits} bits
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className={cn("h-full rounded-full transition-all", STRENGTH_BAR[strength.level])}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>
          )}

          <Button onClick={regenerate} className="w-full" size="lg" disabled={!validation.ok}>
            <RefreshCw className="h-4 w-4" />
            Generar {count > 1 ? `${count} contraseñas` : "contraseña"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert tone="warning" title="Revisa las opciones" role="alert">
          {error}
        </Alert>
      )}

      {/* Opciones */}
      <Card>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pw-length" className="mb-0">
                Longitud
              </Label>
              <span className="font-mono text-sm font-semibold text-foreground" aria-hidden>
                {opts.length}
              </span>
            </div>
            <input
              id="pw-length"
              type="range"
              min={PASSWORD_LIMITS.min}
              max={PASSWORD_LIMITS.max}
              value={opts.length}
              onChange={(e) => update("length", Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-valuemin={PASSWORD_LIMITS.min}
              aria-valuemax={PASSWORD_LIMITS.max}
              aria-valuenow={opts.length}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{PASSWORD_LIMITS.min}</span>
              <span>{PASSWORD_LIMITS.max}</span>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Tipos de carácter</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_LABELS.map(({ key, label, hint }) => {
                const checked = opts[key] as boolean;
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-md border p-3 text-sm transition-colors",
                      checked
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => update(key, e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">{label}</span>
                    <span className="ml-auto font-mono text-xs opacity-70">{hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={opts.excludeAmbiguous}
              onChange={(e) => update("excludeAmbiguous", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Excluir caracteres ambiguos{" "}
            <span className="font-mono text-xs text-muted-foreground">(0 O I l 1 …)</span>
          </label>

          <div>
            <Label htmlFor="pw-count">¿Cuántas contraseñas generar?</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={count === n}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    count === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Alfabeto disponible: <span className="font-mono">{alphabetSize}</span> caracteres. Todo se
            genera en tu navegador con <code className="font-mono">crypto.getRandomValues()</code>; las
            contraseñas no se envían ni se guardan en ningún sitio.
          </p>
        </CardContent>
      </Card>

      {/* Lista cuando se generan varias */}
      {passwords.length > 1 && (
        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-medium text-foreground">
              {passwords.length} contraseñas generadas
            </p>
            <ul className="divide-y divide-border">
              {passwords.map((pw, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm break-all text-foreground">
                    {reveal ? pw : "•".repeat(Math.min(pw.length, 40))}
                  </code>
                  <button
                    type="button"
                    onClick={() => onCopy(pw, i)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    aria-label={`Copiar contraseña ${i + 1}`}
                  >
                    {copiedIndex === i ? (
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Alert tone="info">
        La fortaleza mostrada es <strong className="text-foreground">orientativa</strong>: estima la
        entropía del generador (longitud × log₂ del alfabeto). La resistencia real también depende de
        cómo se use, se almacene y se proteja la contraseña. Ninguna contraseña es «imposible de
        hackear».
      </Alert>
    </div>
  );
}
