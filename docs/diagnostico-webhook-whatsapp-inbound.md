# Diagnóstico: mensajes WhatsApp no llegan a Kite Prospect

Flujo esperado: **Meta** → `POST https://TU-DOMINIO/api/webhooks/whatsapp` → firma opcional → cuenta `WHATSAPP_ACCOUNT_SLUG` → parseo JSON → `Contact` + `Conversation` + `Message` → **Inbox**.

El **middleware** de la app **no** aplica a `/api/webhooks/*` (solo `/dashboard` y `/api/auth`).

---

## 1. ¿Meta llama a tu URL?

| Comprobación | Si falla |
|--------------|----------|
| En **Meta** → WhatsApp → Webhook: URL exacta `https://kite-prospect.vercel.app/api/webhooks/whatsapp` (sin espacios) | Corregir y **Verificar y guardar** |
| En **Vercel** → **Logs** (Runtime), enviá un mensaje al número de prueba y buscá líneas con path `webhooks/whatsapp` o método `POST` | Si **no hay ningún POST**, Meta no está entregando: revisar suscripción al campo **`messages`**, modo de la app, número de prueba |

---

## 2. Interpretar el código HTTP del POST (Vercel Logs o respuesta de Meta)

| Código | Causa típica | Qué hacer |
|--------|----------------|-----------|
| **401** `Firma inválida` | `WHATSAPP_APP_SECRET` ≠ clave secreta de la **misma app** en Meta | Configuración de la app → **Básica** → Mostrar → copiar a Vercel → redeploy |
| **503** | Falta `WHATSAPP_ACCOUNT_SLUG` | Poner `demo` (o el slug real de la cuenta en BD) |
| **404** | No existe `Account` con ese slug en **esta** `DATABASE_URL` | `db:seed` / migraciones en el entorno correcto |
| **200** con cuerpo `processed: 0`, `kind: "empty"` | POST llegó pero el JSON **no** trae mensajes en el formato esperado | Suscripción al campo **`messages`** en el webhook; ver log estructurado `whatsapp_webhook_no_inbound_extracted` y `objectField` |

---

## 3. Logs estructurados (consola Vercel)

Tras desplegar la versión con trazas en `route.ts`, buscá en logs (texto JSON):

| `event` | Significado |
|---------|-------------|
| `whatsapp_webhook_signature_invalid` | Firma HMAC incorrecta o cabecera ausente |
| `whatsapp_webhook_account_slug_missing` | Falta variable de entorno |
| `whatsapp_webhook_account_not_found` | Slug no existe en PostgreSQL |
| `whatsapp_webhook_no_inbound_extracted` | 200 OK pero sin `messages`/`statuses` parseables (`objectField` ayuda a ver si el payload es otro tipo) |

---

## 4. Inbox: qué número buscar

El **contacto** guarda el teléfono del **remitente** (`from` en el webhook), es decir **tu celular**, no el número de negocio de prueba de Meta.

Buscá en Inbox por los dígitos de **tu** línea (ej. `549…`), canal **WhatsApp**.

---

## 5. GET en el navegador muestra "Forbidden"

Normal: la verificación GET exige `?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`. Sin eso → **403**.

---

## Referencias

- Código: `apps/web/src/app/api/webhooks/whatsapp/route.ts`
- Parser: `apps/web/src/domains/integrations/whatsapp/parse-cloud-api.ts` (`object: whatsapp_business_account`)
