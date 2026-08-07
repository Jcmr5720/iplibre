"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, FileText, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { menuGroups, relatedApps } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Enlaces siempre visibles en la barra (las acciones de mayor intención). */
const primaryLinks = [
  { href: "/mi-ip", label: "Mi IP" },
  { href: "/test-de-velocidad", label: "Velocidad" },
];

export function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const megaRef = React.useRef<HTMLDivElement>(null);
  const megaBtnRef = React.useRef<HTMLButtonElement>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);

  // Solo renderiza el portal tras el montaje (evita desajustes de hidratación).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Cierra todo al navegar.
  React.useEffect(() => {
    setDrawerOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  // Escape cierra cualquier panel abierto.
  React.useEffect(() => {
    if (!drawerOpen && !megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawerOpen) menuBtnRef.current?.focus();
        else if (megaOpen) megaBtnRef.current?.focus();
        setDrawerOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, megaOpen]);

  // Clic fuera cierra el mega-menú de escritorio.
  React.useEffect(() => {
    if (!megaOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        megaRef.current &&
        !megaRef.current.contains(e.target as Node) &&
        !megaBtnRef.current?.contains(e.target as Node)
      ) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [megaOpen]);

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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="IPLibre — inicio" className="shrink-0">
          <Logo />
        </Link>

        {/* Navegación escritorio */}
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}

          <button
            ref={megaBtnRef}
            type="button"
            onClick={() => setMegaOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              megaOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            aria-expanded={megaOpen}
            aria-haspopup="true"
            aria-controls="mega-menu"
          >
            Herramientas
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", megaOpen && "rotate-180")}
              aria-hidden
            />
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            ref={menuBtnRef}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mega-menú de escritorio */}
      {megaOpen && (
        <div
          id="mega-menu"
          ref={megaRef}
          className="absolute inset-x-0 top-16 hidden border-b border-border bg-background/98 shadow-lg backdrop-blur-md md:block"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[repeat(4,1fr)_1.1fr]">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Otras aplicaciones */}
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Otras aplicaciones
              </p>
              <ul className="space-y-2">
                {relatedApps.map((app) => (
                  <li key={app.href}>
                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          {app.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {app.tagline}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Drawer móvil — renderizado en un portal a <body> para escapar del
          contexto de apilamiento del header (backdrop-filter crea un bloque
          contenedor que rompería `position: fixed`). */}
      {mounted &&
        drawerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-drawer"
            className="absolute right-0 top-0 flex h-[100dvh] w-[86%] max-w-sm flex-col overflow-y-auto overscroll-contain border-l border-border bg-background shadow-2xl [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
                aria-label="Cerrar menú"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Menú móvil" className="flex-1 px-4 py-5">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted",
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="mb-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Otras aplicaciones
                </p>
                <ul className="space-y-2">
                  {relatedApps.map((app) => (
                    <li key={app.href}>
                      <a
                        href={app.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3 transition-colors hover:bg-muted"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                            {app.name}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {app.tagline}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>,
          document.body,
        )}
    </header>
  );
}
