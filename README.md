# IPLibre

**Descubre tu IP y mide la velocidad de tu Internet.**

IPLibre es una plataforma gratuita e independiente de diagnóstico de Internet: consulta de IP
pública, test de velocidad real, latencia/jitter, geolocalización aproximada, DNS, WHOIS/RDAP, ASN,
propagación DNS y reverse DNS. Datos reales, sin registro y con la privacidad como principio de
diseño.

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** con modo claro/oscuro (next-themes)
- **Zod** para validación de entradas
- **Vitest** (unit + integración) y **Playwright** (E2E)
- **Vercel Analytics** y **Speed Insights**
- Iconos: **lucide-react** · PDF: **jsPDF** (carga diferida)

## Herramientas

| Ruta | Función |
| --- | --- |
| `/mi-ip` | IP pública, ISP, ASN y ubicación aproximada |
| `/test-de-velocidad` | Descarga, subida, latencia y jitter reales |
| `/diagnostico-de-internet` | Chequeo integral de la conexión |
| `/geolocalizar-ip` | Geolocalización aproximada de una IP |
| `/whois` | WHOIS/RDAP de dominios, IP y ASN |
| `/dns-lookup` | Registros DNS (A, AAAA, MX, TXT, …) vía DoH |
| `/propagacion-dns` | Comparación entre resolutores públicos |
| `/asn-lookup` | ASN, organización y prefijos anunciados |
| `/reverse-dns` | Registro PTR / resolución directa |

## Fuentes de datos (gratuitas, sin clave)

- **Velocidad:** red de medición de Cloudflare (`speed.cloudflare.com`), con capa de proveedores intercambiable.
- **IP / geolocalización:** ipwho.is → ipapi.co (degradación en cadena).
- **DNS / propagación:** DNS-over-HTTPS (Cloudflare, Google, Quad9).
- **WHOIS/RDAP:** bootstrap RDAP estandarizado (`rdap.org`).
- **ASN / enrutamiento:** RIPEstat → BGPView (fallback).

## Desarrollo

```bash
npm install
npm run dev
```

## Calidad

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run test        # Vitest (unit + integración)
npm run test:e2e    # Playwright (requiere: npx playwright install chromium)
npm run build       # Build de producción
```

## Variables de entorno

Todas opcionales. Ver [`.env.example`](./.env.example). La app funciona sin ninguna clave y degrada
de forma honesta cuando una fuente o proveedor no está disponible.

## Privacidad

No se almacena la IP de forma permanente, no hay cookies publicitarias ni fingerprinting invasivo, y
el historial del test de velocidad se guarda solo en el navegador (localStorage).

## Limitaciones (honestidad técnica)

- La geolocalización por IP es **aproximada**.
- La "latencia" del test es el **tiempo de ida y vuelta HTTPS**, no ping ICMP.
- La propagación DNS compara **resolutores públicos** (anycast), no puntos físicos por país.
- Los resultados son orientativos y no sustituyen una medición certificada del proveedor.
