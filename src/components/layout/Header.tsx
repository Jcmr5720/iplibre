"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Grid3x3,
  LayoutGrid,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DonateButton } from "@/components/donation/DonateButton";
import {
  aboutLinks,
  learnLinks,
  primaryTools,
  relatedApps,
  searchTools,
  toolCategories,
  type NavItem,
} from "@/lib/config";
import { TOOL_ICONS, FALLBACK_TOOL_ICON } from "@/components/nav/toolIcons";
import { cn } from "@/lib/utils";

/** Identificador del panel de escritorio abierto (solo uno a la vez). */
type OpenMenu = string | null;

/* -------------------------------------------------------------------------- */
/*  Fila compacta de herramienta (icono + nombre + descripción)               */
/* -------------------------------------------------------------------------- */

function ToolRow({
  tool,
  onNavigate,
}: {
  tool: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = TOOL_ICONS[tool.href] ?? FALLBACK_TOOL_ICON;
  return (
    <Link
      href={tool.href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{tool.label}</span>
        {tool.description && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {tool.description}
          </span>
        )}
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Enlace de "recomendación" a PDFLibre (discreto, proporcional)             */
/* -------------------------------------------------------------------------- */

function AppRecommendation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {relatedApps.map((app) => (
        <a
          key={app.href}
          href={app.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-sm font-medium text-foreground">
              {app.name}
              <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {app.tagline}
            </span>
          </span>
        </a>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                      */
/* -------------------------------------------------------------------------- */

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState<OpenMenu>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const deskRef = React.useRef<HTMLDivElement>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Cierra todo al navegar.
  React.useEffect(() => {
    setOpen(null);
    setDrawerOpen(false);
  }, [pathname]);

  // Enfoca el buscador al abrir "Todas las herramientas".
  React.useEffect(() => {
    if (open === "todas") {
      const t = setTimeout(() => searchRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    if (open === null) setQuery("");
  }, [open]);

  // Escape cierra el panel de escritorio o el drawer.
  React.useEffect(() => {
    if (!open && !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawerOpen) {
        setDrawerOpen(false);
        menuBtnRef.current?.focus();
      } else if (open) {
        const btn = triggerRefs.current[open];
        setOpen(null);
        btn?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, drawerOpen]);

  // Clic fuera cierra el panel de escritorio. El mega-menú "Todas" se renderiza
  // en un portal fuera de deskRef, así que también se comprueba su contenedor.
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesk = deskRef.current?.contains(target);
      const insidePanel = (target as Element)?.closest?.("[data-desk-panel]");
      if (!insideDesk && !insidePanel) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Bloquea el scroll del body con el drawer abierto.
  React.useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));
  const close = () => setOpen(null);

  const results = React.useMemo(() => searchTools(query), [query]);
  const searching = query.trim().length > 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="IPLibre — inicio" className="shrink-0">
          <Logo />
        </Link>

        {/* Navegación de escritorio (a partir de 1024px; tablet usa el drawer).
            Estructura tipo PDFLibre: logo a la izquierda, menú centrado y
            controles (donar, tema, menú extra) a la derecha. */}
        <div ref={deskRef} className="hidden flex-1 items-center lg:flex">
          <nav aria-label="Principal" className="mx-auto flex items-center gap-0.5">
            {/* Enlaces directos a las herramientas primarias (estilo PDFLibre) */}
            {primaryTools.map((tool) => {
              const active = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {tool.label}
                </Link>
              );
            })}

            {/* Todas las herramientas → mega-menú con buscador */}
            <div className="relative">
              <button
                ref={(el) => {
                  triggerRefs.current["todas"] = el;
                }}
                type="button"
                onClick={() => toggle("todas")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  open === "todas" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-expanded={open === "todas"}
                aria-haspopup="menu"
                aria-controls="menu-todas"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Todas las herramientas
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", open === "todas" && "rotate-180")}
                  aria-hidden
                />
              </button>
            </div>
          </nav>

          {/* Controles a la derecha */}
          <div className="flex items-center gap-1">
            <DonateButton variant="compact" />

            <ThemeToggle />

            {/* Menú secundario "Más" */}
            <div className="relative">
            <button
              ref={(el) => {
                triggerRefs.current["mas"] = el;
              }}
              type="button"
              onClick={() => toggle("mas")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                open === "mas"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-label="Más: recursos, IPLibre y otras aplicaciones"
              aria-expanded={open === "mas"}
              aria-haspopup="menu"
              aria-controls="menu-mas"
            >
              <Grid3x3 className="h-5 w-5" aria-hidden />
            </button>

            {open === "mas" && (
              <div
                id="menu-mas"
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-lg"
              >
                <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recursos
                </p>
                <div className="grid grid-cols-2 gap-0.5">
                  {learnLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={close}
                      className="rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>

                <div className="my-2 h-px bg-border" />

                <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  IPLibre
                </p>
                <div className="grid grid-cols-2 gap-0.5">
                  {aboutLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={close}
                      className="rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>

                <div className="my-2 h-px bg-border" />

                <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Otras aplicaciones
                </p>
                <AppRecommendation onNavigate={close} />
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Controles móvil / tablet */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            ref={menuBtnRef}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mega-menú "Todas las herramientas" — banda a lo ancho bajo el header */}
      {open === "todas" &&
        mounted &&
        createPortal(
          <TodasMega
            searchRef={searchRef}
            query={query}
            setQuery={setQuery}
            results={results}
            searching={searching}
            onClose={close}
          />,
          document.body,
        )}

      {/* Drawer móvil */}
      {mounted && drawerOpen && createPortal(
        <MobileDrawer pathname={pathname} onClose={() => setDrawerOpen(false)} />,
        document.body,
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mega-menú "Todas las herramientas"                                         */
/* -------------------------------------------------------------------------- */

function TodasMega({
  searchRef,
  query,
  setQuery,
  results,
  searching,
  onClose,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (v: string) => void;
  results: NavItem[];
  searching: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id="menu-todas"
      role="menu"
      aria-label="Todas las herramientas"
      className="fixed inset-x-0 top-16 z-40 flex justify-center px-4"
      data-desk-panel
    >
      <div className="w-full max-w-[1120px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar una herramienta…"
              aria-label="Buscar una herramienta"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {searching ? (
            results.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {results.map((tool) => (
                  <ToolRow key={tool.href} tool={tool} onNavigate={onClose} />
                ))}
              </div>
            ) : (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No hay herramientas para «{query}».
              </p>
            )
          ) : (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {toolCategories.map((cat) => (
                <div key={cat.id}>
                  <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat.title}
                  </p>
                  {cat.items.map((tool) => (
                    <ToolRow key={tool.href} tool={tool} onNavigate={onClose} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-muted/30 px-4 py-2.5">
          <a
            href={relatedApps[0]?.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            También puedes usar <span className="font-medium text-foreground">PDFLibre</span> —
            herramientas para trabajar con PDF
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drawer móvil con acordeones                                                */
/* -------------------------------------------------------------------------- */

function AccordionSection({
  id,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  title: string;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  children: React.ReactNode;
}) {
  const expanded = openId === id;
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpenId(expanded ? null : id)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-expanded={expanded}
        aria-controls={`acc-${id}`}
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>
      {expanded && (
        <div id={`acc-${id}`} className="pb-2">
          {children}
        </div>
      )}
    </div>
  );
}

function MobileDrawer({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>("conexion");

  return (
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        id="mobile-drawer"
        className="absolute right-0 top-0 flex h-[100dvh] w-[86%] max-w-sm flex-col overflow-y-auto overscroll-contain border-l border-border bg-background shadow-2xl [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Logo />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Menú móvil" className="flex-1 px-4 pb-6">
          <p className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Principales
          </p>
          <ul className="space-y-0.5 pb-2">
            {primaryTools.map((tool) => {
              const active = pathname === tool.href;
              const Icon = TOOL_ICONS[tool.href] ?? FALLBACK_TOOL_ICON;
              return (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {tool.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Herramientas
          </p>

          {toolCategories.map((cat) => (
            <AccordionSection
              key={cat.id}
              id={cat.id}
              title={cat.title}
              openId={openId}
              setOpenId={setOpenId}
            >
              <ul className="space-y-0.5">
                {cat.items.map((tool) => {
                  const active = pathname === tool.href;
                  const Icon = TOOL_ICONS[tool.href] ?? FALLBACK_TOOL_ICON;
                  return (
                    <li key={tool.href}>
                      <Link
                        href={tool.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {tool.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AccordionSection>
          ))}

          <div className="border-b border-border">
            <Link
              href="/herramientas"
              onClick={onClose}
              className="flex items-center gap-2 py-3 text-sm font-semibold text-foreground hover:text-primary"
            >
              <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
              Todas las herramientas
            </Link>
          </div>

          <AccordionSection
            id="recursos"
            title="Recursos"
            openId={openId}
            setOpenId={setOpenId}
          >
            <ul className="space-y-0.5">
              {learnLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    className="block rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection id="iplibre" title="IPLibre" openId={openId} setOpenId={setOpenId}>
            <ul className="space-y-0.5">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    className="block rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <div className="pt-4">
            <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Otras aplicaciones
            </p>
            <AppRecommendation onNavigate={onClose} />
          </div>

          <div className="pt-6">
            <DonateButton variant="block" onClick={onClose} />
          </div>
        </nav>
      </div>
    </div>
  );
}
