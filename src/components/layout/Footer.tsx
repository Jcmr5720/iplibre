import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { footerNav, relatedApps, siteConfig } from "@/lib/config";
import { PrivacyPreferencesButton } from "@/components/privacy/PrivacyPreferencesButton";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.4fr_repeat(6,1fr)]">
          <div className="col-span-full max-w-xs lg:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">{siteConfig.slogan}.</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Herramientas con finalidad informativa y de diagnostico. Las ubicaciones son
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
          <nav aria-label="Otras aplicaciones">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Otras aplicaciones</h2>
            <ul className="space-y-2">
              {relatedApps.map((app) => (
                <li key={app.href}>
                  <a
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {app.name}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {siteConfig.name}. Servicio gratuito e independiente.
          </p>
          <p>Datos WHOIS/RDAP, DNS, ASN y geolocalizacion provienen de fuentes externas publicas.</p>
          <PrivacyPreferencesButton />
        </div>
      </div>
    </footer>
  );
}
