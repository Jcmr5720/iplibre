import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { footerNav, siteConfig } from "@/lib/config";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">{siteConfig.slogan}.</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Herramientas con finalidad informativa y de diagnóstico. Las ubicaciones son
              aproximadas y los resultados pueden variar.
            </p>
          </div>
          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{group.title}</h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {siteConfig.name}. Servicio gratuito e independiente.
          </p>
          <p>
            Datos WHOIS/RDAP, DNS, ASN y geolocalización provienen de fuentes externas públicas.
          </p>
        </div>
      </div>
    </footer>
  );
}
