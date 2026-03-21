# Decisión: widget web embebible (F1-E6 / Sprint S02)

## Contexto

Los sitios del cliente no deben exponer `CAPTURE_API_SECRET`. El patrón de **proxy serverless** (sección API en `docs/capture-integration.md`) sigue siendo el recomendado para landings con backend propio.

Para **HTML estático** sin backend, hace falta un camino sin secreto en el navegador del visitante.

## Decisión

1. **Página** `/embed/lead?slug=cuenta` — misma server action y validación que `/lead`, con canal Prisma **`web_widget`** (hidden en formulario).
2. **Script** estático `public/kite-lead-widget.js` — inyecta un **iframe** cuyo `src` apunta al mismo origen que el script (`new URL(script.src).origin`), así no hace falta configurar URL base en el snippet.
3. **Cabeceras** `next.config.mjs`: `Content-Security-Policy: frame-ancestors *` solo en rutas `/embed/:path*`, para permitir iframes desde dominios de clientes.
4. **Activación:** mismo flag que el formulario público: `ENABLE_PUBLIC_LEAD_FORM=true`.

## Límites

- El iframe no envía cookies del sitio padre a Kite (origen distinto); el formulario corre dentro del iframe (origen Kite) — correcto para server actions.
- Rate limit por IP sigue aplicando al envío desde el iframe (misma IP del visitante respecto al servidor Kite).

## Referencias

- `apps/web/public/kite-lead-widget.js`
- `apps/web/src/app/embed/lead/page.tsx`
- `apps/web/src/app/lead/lead-form.tsx`, `actions.ts`
