import type { MetadataRoute } from "next";

/**
 * Evita que buscadores indexen panel y APIs; rutas públicas (/, /lead, /embed, OpenAPI) siguen permitidas.
 * L25 alta producción — complementa cabeceras en `next.config.mjs`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/"],
      },
    ],
  };
}
