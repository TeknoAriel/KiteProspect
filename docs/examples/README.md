# Ejemplos de integración (copy-paste)

Referencias para **landings y sitios del cliente**. La guía narrativa está en **`docs/capture-integration.md`**.

| Archivo | Uso |
|---------|-----|
| [landing-static-widget.html](./landing-static-widget.html) | Página HTML estática que carga el widget (`kite-lead-widget.js`) por iframe. |
| [landing-serverless-proxy.example.mjs](./landing-serverless-proxy.example.mjs) | Handler de referencia (Node) que reenvía al `POST /api/contacts/create` de Kite con `channel: "landing"`. |

Antes de producción: sustituir `TU-DOMINIO`, `TU-CUENTA-SLUG` y configurar variables en el hosting (Vercel, Netlify, etc.).
