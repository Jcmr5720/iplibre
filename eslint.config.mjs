import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Estos avisos corresponden a patrones deliberados y correctos:
      // - flag "mounted" de next-themes,
      // - cierre del menú móvil al cambiar de ruta,
      // - carga de datos iniciales en cliente (fetch on mount) y lectura de
      //   localStorage tras montar para evitar desajustes de hidratación.
      // Se mantienen como aviso para conservar visibilidad sin bloquear.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
