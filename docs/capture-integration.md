# Integración: captura de leads

Hay dos caminos: **formulario en esta misma app** (`/lead`) o **HTTP** hacia `POST /api/contacts/create`.

## 1. Formulario público en Kite (`/lead`)

- **Ventaja:** no hace falta enviar `CAPTURE_API_SECRET` desde el navegador.
- **Requisito:** en `.env` (raíz): `ENABLE_PUBLIC_LEAD_FORM=true`.
- **URL:** `/lead` (slug por defecto `demo`) o `/lead?slug=tu-cuenta`.
- **Seguridad:** campo honeypot `website` (oculto); si se rellena, el envío se ignora en silencio.

En producción, valora desactivar el formulario (`ENABLE_PUBLIC_LEAD_FORM` sin definir o distinto de `true`) si no lo usas.

## 2. API HTTP `POST /api/contacts/create`

- **Cabecera:** `Authorization: Bearer <CAPTURE_API_SECRET>` o `X-Capture-Secret: <CAPTURE_API_SECRET>`.
- **Cuerpo JSON mínimo:** `accountSlug`, y al menos `email` o `phone`.

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

## 3. Verificación

Tras un envío correcto:

- En el panel: contacto en **Contactos** e hilo en **Inbox** (si aplica).
- En **Auditoría** (admin): evento `lead_captured` con metadata `via` = `api_contacts_create` o `public_lead_form`.

## Referencias

- `docs/decisions/slice-capture-api-hardening.md`
- `docs/manual-actions-required.md`
