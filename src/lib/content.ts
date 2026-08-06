/** Contenido editorial reutilizable (FAQ y conceptos), en español. */

export interface FaqItem {
  q: string;
  a: string;
}

export const faqItems: FaqItem[] = [
  {
    q: "¿Qué es una dirección IP pública?",
    a: "Es el identificador con el que tu red se presenta en Internet. Tu proveedor te la asigna y los sitios web la ven al conectarte. Puede ser IPv4 (por ejemplo 190.85.12.34) o IPv6 (más larga, con grupos hexadecimales).",
  },
  {
    q: "¿Por qué la ubicación de mi IP no coincide con mi casa?",
    a: "La geolocalización por IP es aproximada. Se basa en bases de datos que asocian rangos de IP a zonas, y a menudo apunta a la ciudad del nodo de tu proveedor, no a tu domicilio. No debe usarse para identificar a una persona.",
  },
  {
    q: "¿El test de velocidad usa ping ICMP?",
    a: "No. En un navegador no es posible enviar ping ICMP. Lo que medimos como latencia es el tiempo de ida y vuelta de una petición HTTPS a la red de medición. Lo indicamos con la denominación técnica correcta.",
  },
  {
    q: "¿Qué es el jitter?",
    a: "Es la variación de la latencia entre mediciones consecutivas. Un jitter bajo significa una conexión estable; un jitter alto provoca cortes en videollamadas, streaming y juegos.",
  },
  {
    q: "¿Guardáis mi dirección IP o mis resultados?",
    a: "No almacenamos tu IP de forma permanente. El historial de tus pruebas de velocidad se guarda solo en tu navegador (almacenamiento local) y puedes borrarlo cuando quieras. No lo subimos a ningún servidor.",
  },
  {
    q: "¿Qué diferencia hay entre WHOIS y RDAP?",
    a: "RDAP es el sucesor moderno de WHOIS: devuelve la misma información de registro (dominios, IP, ASN) pero en un formato estructurado y estandarizado. En IPLibre priorizamos RDAP por ser más fiable y consistente.",
  },
  {
    q: "¿Qué es un ASN?",
    a: "Un Sistema Autónomo (ASN) es un identificador de una red que anuncia sus rutas en Internet mediante BGP. Cada gran operador o empresa de red tiene uno o varios ASN (por ejemplo, Google usa AS15169).",
  },
  {
    q: "¿La comparación de propagación DNS mira desde varios países?",
    a: "Comparamos varios resolutores públicos (Cloudflare, Google, Quad9), que son redes anycast globales. No es una observación física desde países concretos: una diferencia sugiere propagación incompleta o respuestas dependientes de la red.",
  },
  {
    q: "¿Los resultados sustituyen a una medición de mi operador?",
    a: "No. Son orientativos y pueden variar según la hora, el servidor, tu red local (Wi-Fi o cable) y otros dispositivos. No sustituyen una medición certificada de tu proveedor.",
  },
];

export interface Concept {
  term: string;
  definition: string;
}

export const concepts: Concept[] = [
  { term: "Velocidad de descarga", definition: "Cuántos datos puedes recibir por segundo. Afecta a streaming y descargas. Se mide en Mbps." },
  { term: "Velocidad de subida", definition: "Cuántos datos puedes enviar por segundo. Afecta a videollamadas y subir archivos." },
  { term: "Latencia (ping)", definition: "El tiempo de ida y vuelta de una petición. Menor es mejor, especialmente en juegos." },
  { term: "Jitter", definition: "La variación de la latencia. Un valor bajo indica una conexión estable." },
  { term: "DNS", definition: "El sistema que traduce nombres (ejemplo.com) a direcciones IP. Su rapidez influye en la navegación." },
  { term: "ASN", definition: "Identificador de una red autónoma en Internet. Indica a qué operador pertenece una IP." },
  { term: "WHOIS / RDAP", definition: "Datos de registro de dominios, IP y ASN: quién los gestiona, fechas y estados." },
];
