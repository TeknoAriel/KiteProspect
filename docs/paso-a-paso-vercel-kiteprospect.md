# Paso a paso — demo en Vercel (URL de tu proyecto)

Usa esta guía como checklist. Tu URL pública de la app es:

**`https://TU-DEPLOYMENT.vercel.app`**

> Si en el navegador ves otra variante (mayúsculas, etc.), usa **exactamente** la que muestre la barra de direcciones.

---

## Parte 1 — Variables en Vercel (hazlo primero)

### Dónde entrar

1. Abre: **https://vercel.com**
2. Inicia sesión.
3. Entra al proyecto **Kite Prospect** (o el nombre que le pusiste).
4. Menú superior: **Settings** (Configuración).
5. Menú lateral: **Environment Variables** (Variables de entorno).

### Qué crear (una fila por variable)

Para cada fila: **Key** = nombre exacto · **Value** = lo que completes tú · **Environment** = marca **Production** (y *Preview* si quieres el mismo comportamiento en previews).

| # | Key (copiar tal cual) | Value (qué completar tú) | Obligatorio |
|---|------------------------|-------------------------|-------------|
| 1 | `DATABASE_URL` | La cadena completa de conexión **PostgreSQL** que te da Neon, Supabase, Vercel Postgres, Railway, etc. Suele empezar por `postgresql://...` | **Sí** |
| 2 | `AUTH_SECRET` | Un texto secreto largo (puedes generar uno en tu PC: `openssl rand -base64 32` o un generador seguro). **No** uses el mismo que en tu `.env` local si quieres separar entornos. | **Sí** |
| 3 | `AUTH_URL` | Pega **exactamente** esto (sin espacio al final, sin `/` al final): `https://TU-DEPLOYMENT.vercel.app` | **Sí** |
| 4 | `CAPTURE_API_SECRET` | Otro secreto distinto de `AUTH_SECRET` (solo si vas a usar la API de captura de leads). Si no la usarás aún, puedes omitirla. | No |
| 5 | `ENABLE_PUBLIC_LEAD_FORM` | Si quieres el formulario público: `true`. Si no: no la pongas o pon `false`. | No |

6. Pulsa **Save** en cada variable si tu panel lo pide.
7. Ve a **Deployments** → abre el último deploy → **⋯** → **Redeploy** (o haz un commit nuevo) para que el sitio **vuelva a construirse** con estas variables.

---

## Parte 2 — Base de datos (una vez, con la misma BD que producción)

Hazlo **en tu computadora**, en la carpeta del proyecto, con la misma `DATABASE_URL` de producción (puedes ponerla temporalmente en `.env` local **solo para este comando**).

En la **raíz** del monorepo:

```bash
npm run db:migrate:deploy
```

- Si termina sin error, esquema listo.
- **Opcional** (datos demo + usuario de prueba):  
  `npm run db:seed`  
  Solo si quieres el login demo en **esa** base (ver Parte 4).

---

## Parte 3 — URLs para abrir en el navegador (en orden)

Copia y pega en la barra de direcciones.

| Paso | Qué compruebas | URL completa |
|------|----------------|--------------|
| 1 | Que la app carga | https://TU-DEPLOYMENT.vercel.app/ |
| 2 | Pantalla de login | https://TU-DEPLOYMENT.vercel.app/login |
| 3 | Panel (tras iniciar sesión) | https://TU-DEPLOYMENT.vercel.app/dashboard |
| 4 | Contactos | https://TU-DEPLOYMENT.vercel.app/dashboard/contacts |
| 5 | Inbox | https://TU-DEPLOYMENT.vercel.app/dashboard/inbox |
| 6 | Seguimiento | https://TU-DEPLOYMENT.vercel.app/dashboard/followups |
| 7 | Auditoría (solo admin) | https://TU-DEPLOYMENT.vercel.app/dashboard/audit |
| 8 | Formulario lead (solo si `ENABLE_PUBLIC_LEAD_FORM=true`) | https://TU-DEPLOYMENT.vercel.app/lead |
| 9 | Mismo formulario fijando cuenta `demo` | https://TU-DEPLOYMENT.vercel.app/lead?slug=demo |

---

## Parte 4 — Pantalla de login: qué escribir en cada campo

Abre: **https://TU-DEPLOYMENT.vercel.app/login**

| Campo en pantalla | Qué escribir |
|-------------------|--------------|
| Slug de cuenta (o “cuenta”) | `demo` |
| Email | `admin@demo.local` |
| Contraseña | `demo123` |

**Importante:** solo funcionará si en esa base de datos **ejecutaste** `npm run db:seed` y existe la cuenta `demo`. Si no hiciste seed, esos datos **no** validarán: tendrás que crear usuario por otro medio.

---

## Parte 5 — (Opcional) Probar API de captura con PowerShell

Solo si configuraste `CAPTURE_API_SECRET` en Vercel y redeploy.

Sustituye `TU_SECRETO` por el valor real de `CAPTURE_API_SECRET`:

```powershell
$base = "https://TU-DEPLOYMENT.vercel.app"
$secret = "TU_SECRETO"
$body = '{"accountSlug":"demo","email":"prueba@example.com","name":"Prueba","message":"Hola","channel":"form"}'
Invoke-RestMethod -Uri "$base/api/contacts/create" -Method POST -Headers @{
  Authorization = "Bearer $secret"
  "Content-Type" = "application/json"
} -Body $body
```

Respuesta esperada: JSON con `contactId` y `conversationId`.

---

## Resumen de 5 líneas

1. Vercel → **Settings** → **Environment Variables** → completa la tabla de la Parte 1.  
2. **Redeploy** del proyecto.  
3. En tu PC: `npm run db:migrate:deploy` con la `DATABASE_URL` de producción.  
4. (Opcional) `npm run db:seed` y luego login Parte 4.  
5. Abre las URLs de la Parte 3 y prueba.

---

## Enlace con el resto de documentación

- `docs/produccion-checklist-usuario.md` — versión genérica (cualquier dominio).  
- `docs/capture-integration.md` — detalle de captura API y landings externos.  
- `docs/manual-actions-required.md` — checklist de acciones humanas.
