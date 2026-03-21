# Acciones manuales requeridas

Este archivo lista **solo** lo que debe hacer una persona (no el código) cuando sea necesario: credenciales externas, altas manuales o decisiones de negocio que no se pueden inferir.

**Norma de trabajo del proyecto** (rol, límites, cómo documentar implementado / pendiente / bloqueado): [working-rules.md](./working-rules.md).

**Solo pruebas en producción (URL pública):** checklist con rutas y ejemplos → **[produccion-checklist-usuario.md](./produccion-checklist-usuario.md)**.

**Vercel `kiteprospect.vercel.app` — paso a paso con URLs y campos a completar:** **[paso-a-paso-vercel-kiteprospect.md](./paso-a-paso-vercel-kiteprospect.md)**.

**Sin saber programar — guía larga con todas las URLs y textos a copiar:** **[paso-a-paso-sin-programar.md](./paso-a-paso-sin-programar.md)**.

**Git + Neon + Vercel — URLs oficiales y configuraciones precisas:** **[accesos-y-configuracion-git-neon-vercel.md](./accesos-y-configuracion-git-neon-vercel.md)**.

**Flujo completo pantalla a pantalla (alineación + CI sin secretos):** **[flujo-completo-pantalla-a-pantalla.md](./flujo-completo-pantalla-a-pantalla.md)**.

---

## Ahora (desarrollo local)

### 1. Tener PostgreSQL disponible

**Qué hacer:** Instalar PostgreSQL en tu PC o crear una base en un servicio en la nube (Neon, Supabase, Railway, etc.).

**Pasos simples (ejemplo con servicio en la nube):**

1. Entra en el sitio del proveedor que elijas (por ejemplo [https://neon.tech](https://neon.tech) o [https://supabase.com](https://supabase.com)).
2. Crea un proyecto nuevo.
3. Copia la **connection string** que te dan (formato `postgresql://...`).
4. Pégala en tu archivo `.env` como `DATABASE_URL=...` (ver `docs/setup-local.md`).

**Por qué:** Sin base de datos no se pueden ejecutar migraciones ni Prisma contra datos reales.

---

### 2. Crear el archivo `.env`

**Qué hacer:** Copiar `.env.example` a `.env` y completar al menos `DATABASE_URL`.

**Pasos:**

1. En la **raíz** del monorepo: copia `.env.example` y renómbralo a `.env`.
2. Abre `.env` y reemplaza el valor de `DATABASE_URL` con tu cadena real.
3. Agrega `AUTH_SECRET` (requerido por NextAuth):

   ```env
   AUTH_SECRET="tu-secreto-aqui-genera-con-openssl-rand-base64-32"
   ```

   **Generar secreto:** En terminal: `openssl rand -base64 32` (o equivalente en tu OS).

4. **Login:** en `/login` indica el **slug de la cuenta** (demo: `demo`), el email y la contraseña. Sin slug correcto no se resuelve el tenant.

5. **Captura vía API:** define `CAPTURE_API_SECRET` en `.env` (mismo patrón que `AUTH_SECRET`). Sin esto, `POST /api/contacts/create` responde **503**. Las peticiones deben enviar el secreto en `Authorization: Bearer …` o en cabecera `X-Capture-Secret`. En el cuerpo JSON usa **`accountSlug`** (p. ej. `demo`), no hace falta exponer el `id` interno de la cuenta.

6. **Formulario `/lead` (opcional):** si quieres probar captura sin curl, pon `ENABLE_PUBLIC_LEAD_FORM=true` en `.env`. No sustituye a landings externas: para eso usa un proxy serverless (ver `docs/capture-integration.md`).

---

### 3. Actualizar instalación tras el bootstrap monorepo (una sola vez)

Si tenías una versión anterior del repo (Next y Prisma en la raíz, sin `apps/` ni `packages/`):

1. Cierra procesos que usen `node_modules` (por ejemplo `npm run dev`).
2. En la raíz del proyecto, borra la carpeta `node_modules` y el archivo `package-lock.json`.
3. Ejecuta de nuevo: `npm install`.
4. Crea o actualiza `.env` en la raíz (paso 2 de arriba).
5. Aplica migraciones: `npm run db:migrate:deploy` y, si quieres datos demo, `npm run db:seed`.

**Por qué:** npm workspaces enlaza `@kite-prospect/web` y `@kite-prospect/db`; un lock antigua puede fallar o apuntar a rutas que ya no existen.

---

### 4. Aplicar migración del campo `password` en User

**Qué hacer:** Ejecutar migración para agregar el campo `password` al modelo `User`.

**Pasos:**

1. Desde la raíz: `npm run db:migrate`
2. Nombre sugerido: `add_password_to_user`
3. Si ya tienes datos en `User`, la migración fallará (campo NOT NULL sin default). Opciones:
   - **Opción A (recomendada para desarrollo):** `npm run db:reset` (borra todo y vuelve a seed)
   - **Opción B:** Editar la migración SQL para hacer `password` nullable temporalmente, luego actualizar datos, luego hacer NOT NULL

**Por qué:** El schema cambió para incluir autenticación.

---

## Más adelante (cuando implementemos cada integración)

### 5. WhatsApp Business API (Fase 1 / cuando toque el canal)

**Qué harás tú:**

1. Tener una cuenta de **Meta Business** y una app en [Meta for Developers](https://developers.facebook.com/).
2. Configurar el producto **WhatsApp** en la app.
3. Obtener **Phone Number ID**, **Access Token** y (si aplica) verificar el número de negocio.
4. Pegar esos valores en `.env` cuando el proyecto documente los nombres exactos de variables.

**URLs útiles:**

- [Meta for Developers](https://developers.facebook.com/)
- Documentación WhatsApp Cloud API: buscar en la ayuda oficial de Meta "WhatsApp Cloud API".

---

### 6. Proveedor de IA (cuando se conecte el motor conversacional)

**Qué harás tú:**

1. Crear cuenta en el proveedor acordado (OpenAI, Anthropic, etc.).
2. Generar una **API key**.
3. Guardarla en `.env` (el nombre de la variable se documentará en `docs/setup-local.md` cuando exista).

**Decisión de negocio:** Elegir proveedor y límites de costo mensual (no se puede inferir desde el código).

---

### 7. Autenticación en producción (cuando despliegues)

**Qué harás tú:**

1. Elegir dominio y URL de la app (ej. `https://app.tudominio.com`).
2. Configurar variables de sesión / OAuth según lo que implementemos (NextAuth, Clerk, etc.).
3. Generar secretos seguros (`openssl rand -base64 32` o equivalente) y guardarlos solo en el entorno de producción, nunca en el repo.

---

### 8. Primera cuenta de inmobiliaria (producción)

**Qué harás tú:**

1. Dar de alta manualmente la primera **Account** (tenant) y el usuario **admin**, o ejecutar un script de seed que documentemos.
2. Definir nombre comercial, slug y roles iniciales.

---

## Decisiones de negocio pendientes (cuando aplique)

| Tema | Qué decidir |
|------|-------------|
| Pesos del score total | Cómo combinar Intent / Readiness / Fit / Engagement en un único `totalScore` (porcentajes). |
| Umbrales de derivación | A partir de qué score o evento pasa el lead a humano automáticamente. |
| Plantillas WhatsApp | Textos aprobados por Meta y tono comercial permitido. |

Cuando tomes una decisión, conviene reflejarla en `docs/product-rules.md` o en configuración por cuenta (`Account.config`).

---

## Cómo usar este archivo

- Antes de pedirte algo, el equipo / la IA debe comprobar si ya está listado aquí.
- Si aparece una acción nueva que requiere humano, **añádela a este documento** con pasos numerados y URLs.
