# Configuración para humanos (sin tecnicismos)

Usá este archivo como **guía escrita**. Los mismos pasos los podés seguir con el asistente **uno por uno** en el chat.

**Regla de oro:** todo lo que sea **secreto** (contraseñas, claves `sk-`, tokens) **no lo pegues en chats públicos** ni en capturas que compartas con extraños. Guardalo solo en tu `.env` y en Vercel.

---

## Paso 1 — Base de datos en internet (Neon)

**Para qué sirve:** que la app guarde contactos, usuarios, etc.

**Dónde entrar:**  
👉 **https://console.neon.tech**

**Qué hacer (orden):**

1. Abrí el link. Iniciá sesión (podés usar cuenta de Google o GitHub).
2. Buscá un botón tipo **“Create project”** o **“New project”** y creá un proyecto (podés dejar el nombre que proponga el sitio).
3. Cuando esté listo, buscá en la pantalla algo como **“Connection string”**, **“Connect”** o **“Connection details”**.
4. Ahí vas a ver un **texto largo** que empieza con `postgresql://`  
   - Copiá **ese texto completo** (es tu cadena de conexión).
5. En tu computadora, en la carpeta del proyecto **Kite Prospect**, abrí el archivo **`.env`** (en la **raíz**, junto a `package.json`). Si no existe, copiá `.env.example` y renombralo a `.env`.
6. Buscá la línea que dice `DATABASE_URL=`. Pegá **entre comillas** lo que copiaste, por ejemplo:
   ```env
   DATABASE_URL="postgresql://...."
   ```
7. Guardá el archivo.

**Qué buscar si no lo encontrás:** palabras **Connection**, **Connect**, **URI**, o un botón **“Copy”** al lado del texto que empieza con `postgresql://`.

---

## Paso 2 — Secreto para que el login funcione (`AUTH_SECRET`)

**Para qué sirve:** que las sesiones de usuario sean seguras.

**No hace falta entrar a ninguna web** para generarlo.

**Qué hacer:**

1. Abrí **PowerShell** o **Terminal** en tu PC.
2. Ejecutá (o pedile a alguien de confianza que te genere un texto aleatorio largo):
   ```bash
   openssl rand -base64 32
   ```
3. Te va a mostrar **una sola línea** de letras y números. **Copiala entera.**
4. En tu archivo **`.env`** (raíz del proyecto), agregá o editá:
   ```env
   AUTH_SECRET="PEGÁ_ACÁ_LA_LÍNEA_QUE_SALIÓ"
   ```
5. Guardá.

---

## Paso 3 — Subir la app a internet (Vercel) y pegar las mismas claves

**Para qué sirve:** que la app esté online con la misma configuración que en tu PC.

**Dónde entrar:**  
👉 **https://vercel.com**

**Qué hacer (idea general):**

1. Iniciá sesión (podés usar la misma cuenta de GitHub si el código está en GitHub).
2. **Importá** o **conectá** el repositorio del proyecto (si ya está subido a GitHub).
3. Entrá a tu **proyecto** → menú **Settings** (Configuración) → **Environment Variables** (Variables de entorno).
4. **Por cada cosa** que tengas en tu `.env` local y quieras usar en producción, creá una variable:
   - **Name (nombre):** exactamente igual que en el archivo, por ejemplo `DATABASE_URL` o `AUTH_SECRET`.
   - **Value (valor):** el mismo texto que pusiste en `.env` (sin comillas a veces el sitio las agrega solo).
   - Marcá **Production** (y si querés, también Preview).
5. Guardá. Luego en **Deployments**, hacé **Redeploy** del último deploy para que tome los cambios.

**Tu dirección web:** en el proyecto, sección **Domains** — ahí ves algo como `nombre.vercel.app`. Esa es la **URL base** de tu app (ejemplo: `https://nombre.vercel.app`).

**Opcional — si el login en la web falla:** en las mismas variables agregá:
- Nombre: `AUTH_URL`  
- Valor: `https://TU-DOMINIO` (reemplazá por tu `nombre.vercel.app` o dominio propio, **con** `https://`).

---

## Paso 4 — Inteligencia artificial (OpenAI)

**Para qué sirve:** que la función de “siguiente acción” conversacional pueda llamar a la IA.

**Dónde entrar:**  
👉 **https://platform.openai.com** (cuenta general)  
👉 **https://platform.openai.com/api-keys** (claves API)

**Qué hacer:**

1. Entrá a **platform.openai.com** y creá sesión o entrá.
2. Si te pide **método de pago** o **billing** (facturación), completalo (muchas cuentas lo necesitan para usar la API).
3. Andá a **API keys** (el segundo link de arriba).
4. Botón **Create new secret key** (Crear clave secreta). Dale un nombre si te lo pide (ej. `kite-prospect`).
5. Te muestra la clave **una sola vez** — suele empezar con `sk-`. **Copiala y guardala en un lugar seguro.**
6. En **`.env`**:
   ```env
   OPENAI_API_KEY="sk-...tu_clave..."
   OPENAI_MODEL="gpt-4o-mini"
   ```
   La segunda línea es opcional; si no la ponés, el programa usa `gpt-4o-mini` igual.
7. En **Vercel** → **Environment Variables**, agregá `OPENAI_API_KEY` (y si querés `OPENAI_MODEL`) como en el Paso 3.

---

## Paso 5 — WhatsApp (Meta / Facebook para desarrolladores)

**Para qué sirve:** recibir mensajes de clientes por WhatsApp y (si configurás envío) mandar respuestas desde la app.

**Dónde entrar:**  
👉 **https://developers.facebook.com/apps**

**Qué buscar en pantalla (nombres aproximados):**

- **WhatsApp** como producto en tu aplicación.
- **Phone number ID** (ID del número) → en tu proyecto va la variable **`WHATSAPP_PHONE_NUMBER_ID`** con ese número/texto que te muestra Meta.
- **Access token** (token de acceso) → variable **`WHATSAPP_ACCESS_TOKEN`** (copiá el token que te da el panel; suele ser largo).
- Para el **webhook** (avisos cuando llega un mensaje):
  - **Verify token:** vos **inventás** una frase secreta (ej. `mi-clave-webhook-2025`) → variable **`WHATSAPP_VERIFY_TOKEN`** — **la misma** tenés que escribirla en la pantalla de configuración del webhook en Meta.
  - **Callback URL** o **URL de devolución de llamada:**  
    `https://TU-DOMINIO/api/webhooks/whatsapp`  
    (reemplazá `TU-DOMINIO` por lo de Vercel, ej. `mi-app.vercel.app`, **sin** barra al final).
- **App Secret** (secreto de la app): en la app → **Settings** → **Basic** → copiá **App Secret** → variable **`WHATSAPP_APP_SECRET`**.

**Variable de la cuenta en Kite:**  
👉 **`WHATSAPP_ACCOUNT_SLUG`** = el **slug** de la inmobiliaria en la app (en datos demo suele ser `demo`).

Todo eso va en **`.env`** y repetido en **Vercel** si usás producción.

---

## Paso 6 — Secreto para que formularios externos creen contactos (`CAPTURE_API_SECRET`)

**Para qué sirve:** que nadie pueda crear contactos a tu nombre sin conocer un secreto.

**No hace falta web especial.**

**Qué hacer:**

1. En la PC, generá un texto aleatorio (igual que el Paso 2):
   ```bash
   openssl rand -base64 32
   ```
2. Copiá el resultado.
3. En **`.env`**:
   ```env
   CAPTURE_API_SECRET="PEGÁ_AQUÍ"
   ```
4. En **Vercel**, misma variable.

Cuando un sistema externo llame a `POST /api/contacts/create`, tendrá que mandar ese secreto en la cabecera (eso lo ve el desarrollador en la documentación del proyecto).

---

## Paso 7 — Secreto para el cron de seguimientos (`CRON_SECRET`)

**Para qué sirve:** que solo vos (o el sistema) puedan disparar el trabajo automático de seguimientos.

**Qué hacer:**

1. Otra vez generá un texto con:
   ```bash
   openssl rand -base64 32
   ```
2. En **`.env`**:
   ```env
   CRON_SECRET="PEGÁ_AQUÍ"
   ```
3. En **Vercel**, la misma variable.

La ruta que protege es el cron de seguimientos (documentada en el repo como `GET /api/cron/follow-up-due`).

---

## Después de todo

- Si cambiás variables en **Vercel**, hacé **Redeploy**.
- El archivo **`.env` nunca** lo subas a Git (debe estar en `.gitignore`).

**Documento técnico complementario (nombres exactos de variables):** `docs/configuracion-manual-paso-a-paso.md`.
