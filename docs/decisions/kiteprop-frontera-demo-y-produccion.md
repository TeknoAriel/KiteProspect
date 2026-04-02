# Frontera KiteProp: demos vs producción (Kite Prospect)

**Fecha:** 2026-04-02  
**Contexto:** Kite Prospect se prueba en **Vercel (preview / demo)** hasta doble aprobación. La plataforma **KiteProp** (`www.kiteprop.com` y subdominios de producción) es entorno **real de clientes** y no debe usarse como valor por defecto en plantillas, scripts de ejemplo ni documentación que pueda disparar tráfico o confundir operaciones.

## Decisión

1. **No documentar** `https://www.kiteprop.com` (ni subdominios de producción de KiteProp) como URL por defecto de `KITEPROP_API_URL` en este repo. Cada entorno usa la **base de API que defina el equipo** (staging, demo dedicada, etc.), acordada por escrito.
2. **Doble aprobación** explícita antes de apuntar integraciones de producto o docs internas a cualquier **dominio de producción** de KiteProp o de Kite Prospect distinto del demo Vercel acordado.
3. **Kite Prospect en la web:** la URL pública es siempre la que muestra **Vercel → Project → Domains** o **Deployments → Visit** (`https://<proyecto>.vercel.app` o dominio custom). No asumir un hostname fijo en guías (evita 404 si el proyecto se renombró o no existe deployment).
4. **MCP / API CRM:** `KITEPROP_API_URL` y tokens solo en configuración local (`~/.cursor/mcp.json`) o secretos de CI; nunca commiteados.

## Implementado

- Plantillas `.mcp.json` con `KITEPROP_API_URL` vacío o placeholder instructivo.
- `docs/product-rules.md` — sección integración CRM externo.
- `docs/decisions/vercel-404-diagnostico.md` — checklist si la URL de demo devuelve 404.

## Referencias

- `docs/kiteprop-mcp-setup.md`
- `docs/decisions/slice-s22-kiteprop-property-feed.md` (feeds: URLs por tenant en config, no dominio global fijo)
