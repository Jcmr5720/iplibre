"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/primitives";

export function SearchForm({
  label,
  placeholder,
  buttonLabel = "Consultar",
  loading,
  onSubmit,
  initialValue = "",
  examples,
  extra,
  inputMode,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  buttonLabel?: string;
  loading?: boolean;
  onSubmit: (value: string) => void;
  initialValue?: string;
  examples?: string[];
  extra?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
}) {
  const [value, setValue] = React.useState(initialValue);
  const id = React.useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={id}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="font-mono"
            aria-describedby={examples ? `${id}-ex` : undefined}
          />
          {extra}
          <Button type="submit" disabled={loading || !value.trim()} className="sm:w-auto">
            {loading ? <Spinner /> : <Search className="h-4 w-4" />}
            {buttonLabel}
          </Button>
        </div>
      </div>
      {examples && examples.length > 0 && (
        <div id={`${id}-ex`} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Ejemplos:</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                onSubmit(ex);
              }}
              className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-foreground transition-colors hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
