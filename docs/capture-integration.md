# Integración: captura de leads

Hay tres caminos principales: **formulario en esta misma app** (`/lead`), **widget por iframe** (`kite-lead-widget.js` → `/embed/lead`), o **HTTP** hacia `POST /api/contacts/create`.

## 1. Formulario público en Kite (`/lead`)

- **Ventaja:** no hace falta enviar `CAPTURE_API_SECRET` desde el navegador.
- **Requisito:** en `.env` (raíz): `ENABLE_PUBLIC_LEAD_FORM=true`.
- **URL:** `/lead` (slug por defecto `demo`) o `/lead?slug=tu-cuenta`.
- **Seguridad:** campo honeypot `website` (oculto); si se rellena, el envío se ignora en silencio.

En producción, valora desactivar el formulario (`ENABLE_PUBLIC_LEAD_FORM` sin definir o distinto de `true`) si no lo usas.

## 2. Widget embebible (iframe, sin secreto en el sitio del cliente)

- **Requisito:** `ENABLE_PUBLIC_LEAD_FORM=true` (mismo que `/lead`).
- **Página interna:** `/embed/lead?slug=demo` — formulario compacto; conversaciones con canal **`web_widget`**.
- **Script:** sirve desde tu despliegue, p. ej. `https://TU-DOMINIO/kite-lead-widget.js` (archivo en `public/`).

Pega antes del `</body>` de la web del cliente (sustituye la URL por la de tu app en producción):

```html
<script
  src="https://TU-DOMINIO/kite-lead-widget.js"
  data-account-slug="demo"
  async
></script>
```

Atributos opcionales en el `<script>`:

| Atributo | Descripción |
|----------|-------------|
| `data-account-slug` o `data-slug` | Slug de la cuenta (default `demo`). |
| `data-target` | `id` del contenedor (default `kite-lead-widget-root`). Si no existe, se crea junto al script. |
| `data-min-height` | Altura mínima del iframe en px (default `520`). |

El script **no** debe alojarse en otro dominio distinto al de la app Kite: el origen del `src` determina dónde carga el iframe.

## 3. API HTTP `POST /api/contacts/create`

- **Cabecera:** `Authorization: Bearer <CAPTURE_API_SECRET>` o `X-Capture-Secret: <CAPTURE_API_SECRET>`.
- **Cuerpo JSON mínimo:** `accountSlug`, y al menos `email` o `phone` (teléfono con **7–15 dígitos** si es el único identificador).
- **Errores comunes:** `400` (validación / JSON inválido), `401` (secreto incorrecto), `404` (slug/UUID de cuenta), `429` (demasiadas peticiones desde la misma IP; ver `Retry-After`), `503` (captura deshabilitada sin `CAPTURE_API_SECRET`).
- **Límite de tasa (opcional):** `CAPTURE_RATE_LIMIT_MAX` y `CAPTURE_RATE_LIMIT_WINDOW_SEC` en el entorno (ver `.env.example`).

```bash
curl -sS -X POST "https://tu-dominio.com/api/contacts/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_CAPTURE_API_SECRET" \
  -d "{\"accountSlug\":\"demo\",\"email\":\"lead@example.com\",\"name\":\"Ana\",\"message\":\"Quiero visitar\",\"channel\":\"form\"}"
```

**Canales válidos** (`channel`, opcional; por defecto `form`): `web_widget`, `landing`, `whatsapp`, `form`.

### Landings en otro dominio (recomendado)

**No** incrustes `CAPTURE_API_SECRET` en JavaScript del navegador: cualquiera podría leerlo.

Patrón habitual:

1. El formulario de la landing hace `POST` a **tu** función serverless (Vercel, Netlify, Cloudflare Workers, etc.).
2. Esa función valida datos básicos, añade el secreto y llama a `POST /api/contacts/create` desde el servidor.

Ejemplo conceptual (Node):

```js
// handler serverless — el secreto solo en variables de entorno del proveedor
const res = await fetch(`${process.env.KITE_BASE_URL}/api/contacts/create`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CAPTURE_API_SECRET}`,
  },
  body: JSON.stringify({
    accountSlug: "demo",
    email: body.email,
    phone: body.phone,
    name: body.name,
    message: body.message,
    channel: "landing",
  }),
});
```

## 4. Landings — patrón unificado (elegir y copiar)

Objetivo: **mismo modelo** (`Contact`, `Conversation`, `lead_captured`) que S01/S02; solo cambia el **canal** y el **sitio** donde corre el código.

### Tabla de decisión

| Situación | Recomendación | Canal en Kite | Secreto en el navegador del visitante |
|-----------|----------------|---------------|----------------------------------------|
| HTML estático sin backend propio | **Widget** §2 o **enlace** a `/lead` | `web_widget` o `form` | **No** |
| Formulario en tu dominio + función serverless (Vercel, Netlify, Cloudflare…) | **Proxy** → `POST /api/contacts/create` §3 | `landing` (recomendado en el JSON) | **No** (solo en env del serverless) |
| Integración backend ya existente (CRM, n8n, etc.) | **API** §3 con Bearer | `landing` / `form` según caso | **No** |

### Snippets copy-paste (repo)

| Qué necesitas | Archivo |
|---------------|---------|
| Página HTML mínima con iframe del widget | [`docs/examples/landing-static-widget.html`](examples/landing-static-widget.html) |
| Handler Node que reenvía al API con `channel: "landing"` | [`docs/examples/landing-serverless-proxy.example.mjs`](examples/landing-serverless-proxy.example.mjs) |
| Índice de ejemplos | [`docs/examples/README.md`](examples/README.md) |

### Enlace simple (sin widget ni API)

Si basta un botón o link: `https://TU-DOMINIO/lead?slug=tu-cuenta` (requiere `ENABLE_PUBLIC_LEAD_FORM=true`). El lead entra con canal **`form`** igual que el formulario hospedado en Kite.

## 5. Verificación

Tras un envío correcto:

- En el panel: contacto en **Contactos** e hilo en **Inbox** (si aplica).
- En **Auditoría** (admin): evento `lead_captured` con metadata `via` = `api_contacts_create` o `public_lead_form`.

### Checklist manual (S01)

1. `CAPTURE_API_SECRET` definido; `POST` con Bearer correcto → `200` y `contactId`.
2. JSON mal formado → `400` con `JSON no válido`.
3. Email inválido o teléfono con menos de 7 dígitos (sin email) → `400`.
4. Repetir muchas peticiones desde la misma IP → `429` (si se supera el límite configurado).
5. `/lead` con `ENABLE_PUBLIC_LEAD_FORM=true`: envío válido → mensaje de éxito; honeypot relleno → sin error visible (idle).
6. **S02:** `/embed/lead?slug=demo` carga en iframe desde otra pestaña o desde una página HTML que incluya el snippet del script; envío válido → contacto con canal `web_widget` en conversación.
7. **S03:** abrir `docs/examples/landing-static-widget.html` en el editor, sustituir dominio/slug; o desplegar el proxy de ejemplo con env `KITE_*` y comprobar `200` / contacto con canal `landing`.

## Referencias

- `docs/decisions/slice-capture-api-hardening.md`
- `docs/decisions/slice-s02-widget-embed.md`
- `docs/decisions/slice-s03-landing-unification.md`
- `docs/examples/README.md`
- `docs/manual-actions-required.md`
