# Guía paso a paso — sin saber programar

Esta guía te dice **qué hacer**, **en qué orden**, **qué página abrir** y **qué texto copiar o pegar**.  
Tu sitio en internet es:

**`https://TU-DEPLOYMENT.vercel.app`**

---

## Palabras que verás (muy breve)

| Palabra | Significado simple |
|---------|-------------------|
| **Variable de entorno** | Un “cajón” con nombre y valor que Vercel guarda para tu app (como contraseñas de la base de datos). |
| **URL / enlace** | La dirección que escribes en el navegador (empieza por `https://`). |
| **Base de datos** | Donde la app guarda contactos, usuarios, etc. Debe ser **PostgreSQL**. |
| **Redeploy / volver a desplegar** | Volver a “construir” el sitio para que use las variables nuevas. |

---

## ANTES DE EMPEZAR — ¿Qué necesitas tener?

1. Una cuenta en **Vercel** (donde está tu sitio).
2. Una base de datos **PostgreSQL** en internet (te guiamos con **Neon**; es gratis para empezar).
3. Acceso al **correo** con el que entras a Vercel y a Neon.

Si algo de esto no lo tienes, créalo cuando el paso lo indique.

---

# PARTE A — Crear la base de datos (Neon)

Neon es un servicio que te da una base PostgreSQL y una **cadena de conexión** (un texto largo que empieza por `postgresql://`).

### A1. Crear cuenta en Neon

1. Abre en el navegador: **https://neon.tech**
2. Pulsa **Sign up** (registrarse).
3. Entra con **GitHub** o **Google** (el que prefieras).
4. Completa lo que pida el asistente (nombre del proyecto, región; puedes dejar lo que sugiera).

### A2. Crear el proyecto y copiar la conexión

1. En el panel de Neon, crea un **proyecto** si aún no existe.
2. Busca algo como **Connection string** o **Connect** / **Connection details**.
3. Elige el formato **URI** o **postgresql://** (debe verse un texto largo).
4. **Copia** todo ese texto y guárdalo en un sitio seguro (Bloc de notas).  
   - Ejemplo de cómo empieza: `postgresql://usuario:contraseña@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require`
5. **No** compartas ese texto en público; es como una contraseña de la base.

> **Importante:** Ese texto completo es lo que más adelante pegarás en Vercel como valor de `DATABASE_URL`.

---

# PARTE B — Poner variables en Vercel

### B1. Entrar a tu proyecto

1. Abre: **https://vercel.com**
2. Inicia sesión.
3. Haz clic en el proyecto donde está **Kite Prospect** (o el nombre que le pusiste).

### B2. Abrir “Variables de entorno”

1. Arriba, pestaña **Settings** (Configuración).
2. Menú izquierdo: **Environment Variables**.

### B3. Añadir cada variable (una por una)

Para **cada fila** de la tabla de abajo:

1. En **Key** escribe el nombre **exacto** (copia y pega la columna “Nombre”).
2. En **Value** pega lo de la columna “Valor que pones tú”.
3. Marca el entorno **Production** (y si quieres también **Preview**).
4. Guarda (**Save**).

#### Tabla — qué crear

| Nombre exacto (Key) | Valor que pones tú (Value) |
|----------------------|----------------------------|
| `DATABASE_URL` | El texto largo **postgresql://...** que copiaste de Neon (Parte A). **Todo en una sola línea.** |
| `AUTH_SECRET` | Un secreto largo. **Opción fácil:** abre **https://generate-secret.vercel.app/32** , copia el texto que sale y pégalo aquí. |
| `AUTH_URL` | Pega **exactamente** esto (sin espacio al final, sin barra `/` al final): `https://TU-DEPLOYMENT.vercel.app` |
| `CAPTURE_API_SECRET` | Otro secreto distinto del anterior. Puedes generar **otro** en **https://generate-secret.vercel.app/32** y pegarlo. (Sirve si más adelante usas captura de leads por API.) |
| `ENABLE_PUBLIC_LEAD_FORM` | Si quieres el formulario de contacto público en la web, escribe: `true` . Si no lo quieres aún, puedes **no** crear esta variable. |

**Resumen de lo que NO debes inventar mal:**

- `AUTH_URL` debe ser exactamente: `https://TU-DEPLOYMENT.vercel.app`
- `DATABASE_URL` debe ser el texto completo de Neon, sin cortarlo.

### B4. Volver a desplegar (obligatorio)

Las variables **no** se aplican del todo hasta que el sitio se vuelve a construir.

1. Ve a la pestaña **Deployments** (Despliegues).
2. Abre el **último** despliegue.
3. Menú **⋯** (tres puntos) → **Redeploy** (Volver a desplegar).
4. Confirma.

Espera a que termine (puede tardar unos minutos).

---

# PARTE C — Preparar las tablas en la base de datos (migraciones)

La aplicación necesita **crear tablas** en PostgreSQL. Eso se hace con un comando del proyecto.

Tienes **dos caminos**:

---

### Camino 1 — Lo hace una persona que sí use la terminal (recomendado si no quieres tocar comandos)

Envía a esa persona:

- El archivo **`.env.example`** del proyecto (para que vea los nombres de variables).
- El valor de **`DATABASE_URL`** de producción (el de Neon), **por un canal seguro**.
- Que en la carpeta del proyecto ejecute **una vez**, en la raíz:

```text
npm install
npm run db:migrate:deploy
```

Opcional (datos de prueba y usuario demo):

```text
npm run db:seed
```

Cuando termine sin error, **continúa en la Parte D** de esta guía.

---

### Camino 2 — Tú lo haces en tu PC (Windows, paso a paso)

Solo si quieres intentarlo tú. Necesitas tener el **código del proyecto** en tu ordenador (carpeta del repositorio).

1. **Instala Node.js** (si no lo tienes): **https://nodejs.org** → descarga la versión **LTS** → instala con “Siguiente” a todo.
2. Abre **PowerShell** (menú Inicio → escribe `PowerShell` → Abrir).
3. Ve a la carpeta del proyecto (cambia la ruta si la tuya es distinta):

```powershell
cd "C:\Users\TU_USUARIO\Kite Prospect"
```

4. Copia tu cadena de Neon y créate un archivo **`.env`** en la **raíz** del proyecto (junto a `package.json`) con **al menos** esta línea (entre comillas, todo el texto de Neon):

```env
DATABASE_URL="postgresql://PEGA_AQUI_TODO_EL_TEXTO_DE_NEON"
```

5. Ejecuta, **una línea cada vez**, y espera a que termine:

```powershell
npm install
npm run db:migrate:deploy
```

6. **Opcional** — para tener usuario de prueba `demo`:

```powershell
npm run db:seed
```

Si aparece **error**, anota el mensaje completo y pídele ayuda a quien te ayude con el proyecto (o revisa que `DATABASE_URL` esté bien pegada).

Cuando esto termine bien, **continúa en la Parte D**.

---

# PARTE D — Probar en el navegador (solo enlaces)

Abre cada enlace **en orden**, reemplazando `TU-DEPLOYMENT.vercel.app` por la URL que muestre **Vercel → Deployments → Visit** (o **Domains**).

| Paso | Qué deberías ver | Enlace (copiar y pegar) |
|------|------------------|-------------------------|
| 1 | Página de inicio de Kite Prospect | https://TU-DEPLOYMENT.vercel.app/ |
| 2 | Pantalla de inicio de sesión | https://TU-DEPLOYMENT.vercel.app/login |
| 3 | Panel (solo si ya iniciaste sesión en el paso 2) | https://TU-DEPLOYMENT.vercel.app/dashboard |
| 4 | Lista de contactos | https://TU-DEPLOYMENT.vercel.app/dashboard/contacts |
| 5 | Inbox | https://TU-DEPLOYMENT.vercel.app/dashboard/inbox |
| 6 | Seguimiento | https://TU-DEPLOYMENT.vercel.app/dashboard/followups |
| 7 | Auditoría (solo si tu usuario es administrador) | https://TU-DEPLOYMENT.vercel.app/dashboard/audit |
| 8 | Formulario público (solo si pusiste `ENABLE_PUBLIC_LEAD_FORM` = `true`) | https://TU-DEPLOYMENT.vercel.app/lead |

---

# PARTE E — Iniciar sesión: qué escribir en cada casilla

Abre: **https://TU-DEPLOYMENT.vercel.app/login**

**Solo funciona si** en la base de datos ejecutaste **`npm run db:seed`** (Camino 1 o 2 de la Parte C) y existe la cuenta demo.

| Casilla en pantalla | Qué escribes |
|---------------------|--------------|
| Slug de cuenta (o “cuenta”) | `demo` |
| Email | `admin@demo.local` |
| Contraseña | `demo123` |

Si **no** hiciste seed, esos datos **no** entrarán: hace falta crear usuarios de otra forma (eso ya es tarea para quien programe).

---

# PARTE F — Si algo sale mal (respuestas rápidas)

| Problema | Qué revisar |
|----------|-------------|
| La página no carga | Espera unos minutos tras el Redeploy; recarga con **F5**. |
| Error al iniciar sesión | `AUTH_URL` en Vercel = `https://TU-DEPLOYMENT.vercel.app` (sin `/` final); `AUTH_SECRET` definido; **Redeploy** hecho. |
| Error de base de datos / “can’t reach” | `DATABASE_URL` en Vercel = el texto **completo** de Neon; la base encendida en Neon. |
| Panel vacío o errores raros | ¿Se ejecutó **`db:migrate:deploy`** sin error? Sin tablas, la app falla. |
| `/lead` no aparece o no envía | Variable `ENABLE_PUBLIC_LEAD_FORM` = `true` y **Redeploy**. |

---

# Lista de enlaces útiles (todo en una tabla)

| Para qué sirve | Enlace |
|----------------|--------|
| Entrar a Vercel | https://vercel.com |
| Crear base PostgreSQL (Neon) | https://neon.tech |
| Generar un secreto (AUTH / captura) | https://generate-secret.vercel.app/32 |
| Descargar Node.js (solo si haces Camino 2) | https://nodejs.org |
| Tu sitio (inicio) | https://TU-DEPLOYMENT.vercel.app/ |
| Login | https://TU-DEPLOYMENT.vercel.app/login |
| Panel | https://TU-DEPLOYMENT.vercel.app/dashboard |

---

# Resumen en 6 frases

1. Creas base en **Neon** y copias la cadena **postgresql://…**  
2. En **Vercel** → **Settings** → **Environment Variables** pegas `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, y lo demás según la tabla.  
3. Haces **Redeploy**.  
4. Alguien ejecuta **`npm run db:migrate:deploy`** (y opcionalmente **`db:seed`**) con esa base.  
5. Abres **https://TU-DEPLOYMENT.vercel.app/login** y pruebas usuario demo **solo si** hiciste seed.  
6. Si falla, usa la **Parte F** de esta misma página.

---

Documento relacionado (más técnico, mismo dominio): **`docs/paso-a-paso-vercel-kiteprospect.md`**.
