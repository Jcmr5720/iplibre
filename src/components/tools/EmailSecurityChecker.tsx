"use client";

import * as React from "react";
import { Mail, Search, ChevronDown } from "lucide-react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label, Badge, Skeleton, Spinner } from "@/components/ui/primitives";
import { ResultBanner, type BannerTone } from "@/components/tools/ResultBanner";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";
import type { SpfAnalysis } from "@/lib/mail/spf";
import type { DmarcAnalysis } from "@/lib/mail/dmarc";
import type { DkimAnalysis } from "@/lib/mail/dkim";
import { COMMON_DKIM_SELECTORS } from "@/lib/mail/dkim";

type ComponentGrade = "correcto" | "mejorable" | "ausente" | "inválido" | "no comprobado";
type OverallGrade = "Buena" | "Mejorable" | "Insuficiente";

interface Data {
  domain: string;
  spf: SpfAnalysis;
  dmarc: DmarcAnalysis;
  dkim: DkimAnalysis | null;
  grades: { spf: ComponentGrade; dkim: ComponentGrade; dmarc: ComponentGrade };
  overall: OverallGrade;
  checkedAt: string;
}

const GRADE_TONE: Record<ComponentGrade, BannerTone> = {
  correcto: "success",
  mejorable: "warning",
  ausente: "warning",
  inválido: "danger",
  "no comprobado": "neutral",
};

const GRADE_BADGE: Record<ComponentGrade, "success" | "warning" | "danger" | "neutral"> = {
  correcto: "success",
  mejorable: "warning",
  ausente: "warning",
  inválido: "danger",
  "no comprobado": "neutral",
};

const OVERALL_TONE: Record<OverallGrade, BannerTone> = {
  Buena: "success",
  Mejorable: "warning",
  Insuficiente: "danger",
};

const OBS_TONE: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

function Observations({ items }: { items: { tone: string; text: string }[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {items.map((o, i) => (
        <li key={i} className="flex gap-2">
          <span className={cn("mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full", {
            "bg-success": o.tone === "success",
            "bg-warning": o.tone === "warning",
            "bg-danger": o.tone === "danger",
            "bg-info": o.tone === "info",
          })} aria-hidden />
          <span className="text-foreground/80">{o.text}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  grade,
  children,
}: {
  title: string;
  grade: ComponentGrade;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <Badge tone={GRADE_BADGE[grade]} className="capitalize">
            {grade}
          </Badge>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function EmailSecurityChecker() {
  const { data, error, loading, run } = useApiQuery<Data>();
  const [domain, setDomain] = React.useState("");
  const [selector, setSelector] = React.useState("");
  const domainId = React.useId();
  const selectorId = React.useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = domain.trim();
    if (!d) return;
    const params = new URLSearchParams({ domain: d });
    if (selector.trim()) params.set("selector", selector.trim());
    run(`/api/email-security?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={domainId}>Dominio</Label>
                <Input
                  id={domainId}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="ejemplo.com"
                  inputMode="url"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="font-mono"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor={selectorId}>
                  Selector DKIM <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={selectorId}
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="google, selector1…"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="font-mono"
                  aria-describedby={`${selectorId}-help`}
                />
              </div>
            </div>

            <p id={`${selectorId}-help`} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>El selector DKIM depende del proveedor de correo. Ejemplos:</span>
              {COMMON_DKIM_SELECTORS.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelector(s)}
                  className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-foreground transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </p>

            <Button type="submit" disabled={loading || !domain.trim()} className="w-full sm:w-auto">
              {loading ? <Spinner /> : <Search className="h-4 w-4" />}
              Comprobar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert tone="warning" title="No se pudo comprobar" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Consultando SPF, DMARC{selector.trim() ? " y DKIM" : ""}…
            </p>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <ResultBanner
            tone={OVERALL_TONE[data.overall]}
            icon={<Mail className="h-5 w-5" />}
            label={`Seguridad de correo: ${data.overall}`}
            detail={`Dominio ${data.domain}. Resumen orientativo basado en SPF, DMARC${data.dkim ? " y DKIM" : ""}.`}
            aside={
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                <Badge tone={GRADE_BADGE[data.grades.spf]}>SPF: {data.grades.spf}</Badge>
                <Badge tone={GRADE_BADGE[data.grades.dmarc]}>DMARC: {data.grades.dmarc}</Badge>
                <Badge tone={GRADE_BADGE[data.grades.dkim]}>DKIM: {data.grades.dkim}</Badge>
              </div>
            }
          />

          {/* SPF */}
          <SectionCard title="SPF" grade={data.grades.spf}>
            {data.spf.found && data.spf.record && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-2">
                <code className="min-w-0 break-all font-mono text-xs text-foreground">
                  {data.spf.record}
                </code>
                <CopyButton value={data.spf.record} compact aria-label="Copiar registro SPF" />
              </div>
            )}
            {data.spf.found && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.spf.allPolicy && <Badge tone="neutral">{data.spf.allPolicy}</Badge>}
                <Badge tone={data.spf.dnsLookups > 10 ? "danger" : "neutral"}>
                  {data.spf.dnsLookups} búsquedas DNS
                </Badge>
                {data.spf.includes.length > 0 && (
                  <Badge tone="neutral">{data.spf.includes.length} includes</Badge>
                )}
              </div>
            )}
            <Observations items={data.spf.observations} />
          </SectionCard>

          {/* DMARC */}
          <SectionCard title="DMARC" grade={data.grades.dmarc}>
            {data.dmarc.found && data.dmarc.record && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-2">
                <code className="min-w-0 break-all font-mono text-xs text-foreground">
                  {data.dmarc.record}
                </code>
                <CopyButton value={data.dmarc.record} compact aria-label="Copiar registro DMARC" />
              </div>
            )}
            {data.dmarc.found && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.dmarc.policy && <Badge tone="neutral">p={data.dmarc.policy}</Badge>}
                {data.dmarc.subdomainPolicy && (
                  <Badge tone="neutral">sp={data.dmarc.subdomainPolicy}</Badge>
                )}
                {data.dmarc.pct !== null && <Badge tone="neutral">pct={data.dmarc.pct}</Badge>}
                {data.dmarc.rua.length > 0 && <Badge tone="success">informes rua</Badge>}
              </div>
            )}
            <Observations items={data.dmarc.observations} />
          </SectionCard>

          {/* DKIM */}
          {data.dkim ? (
            <SectionCard title={`DKIM · selector «${data.dkim.selector}»`} grade={data.grades.dkim}>
              {data.dkim.found && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.dkim.keyType && <Badge tone="neutral">k={data.dkim.keyType}</Badge>}
                  {data.dkim.hashAlgorithms.length > 0 && (
                    <Badge tone="neutral">h={data.dkim.hashAlgorithms.join(",")}</Badge>
                  )}
                  {data.dkim.flags.length > 0 && (
                    <Badge tone="warning">t={data.dkim.flags.join(",")}</Badge>
                  )}
                </div>
              )}
              {data.dkim.found && data.dkim.publicKey && (
                <details className="mt-3 rounded-md border border-border">
                  <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-sm font-medium marker:hidden">
                    <ChevronDown className="h-4 w-4" aria-hidden />
                    Ver clave pública
                  </summary>
                  <div className="flex items-start gap-2 px-3 pb-3">
                    <code className="min-w-0 break-all font-mono text-xs text-muted-foreground">
                      {data.dkim.publicKey}
                    </code>
                    <CopyButton value={data.dkim.publicKey} compact aria-label="Copiar clave pública DKIM" />
                  </div>
                </details>
              )}
              <Observations items={data.dkim.observations} />
            </SectionCard>
          ) : (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">DKIM</h3>
                  <Badge tone="neutral">no comprobado</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  DKIM necesita un selector, que depende del proveedor de correo. Introduce uno arriba
                  (por ejemplo <code className="font-mono">google</code> o{" "}
                  <code className="font-mono">selector1</code>) para comprobarlo.
                </p>
              </CardContent>
            </Card>
          )}

          <Alert tone="info">
            Este resumen es <strong className="text-foreground">orientativo</strong>: comprueba la
            presencia y configuración de los registros DNS de autenticación de correo, no el
            comportamiento real de tu servidor de correo ni la entrega de cada mensaje.
          </Alert>
        </div>
      )}
    </div>
  );
}
