# Vercel atrasado respecto a GitHub (diagnóstico y alineación)

## Síntoma

- En **GitHub** el último commit en `main` es reciente (p. ej. `306ccf5`) y **Actions** está verde.
- En **Vercel → Deployments** el último deploy por **git** muestra un commit **antiguo** (p. ej. marzo, mensajes tipo S21), o solo hay **Redeploy** manual.

Eso indica que **el build automático por push no está ligado al mismo repo/rama** que usás para desarrollar, o la **integración Git ↔ Vercel** quedó desactualizada.

## Comprobación rápida

| Dónde | Qué mirar |
|--------|-----------|
| Git local | `git remote -v` → debe ser `kiteprop/ia-kiteprospects` (o el repo canónico del equipo). |
| GitHub | Rama `main` → último commit (hash corto) y fecha. |
| Vercel | Deployment **Ready** → abrir el deployment → sección **Source** / **Git** → **commit** y mensaje. Debe coincidir con GitHub `main`. |

Si el hash en Vercel **no** coincide con GitHub `main`, el proyecto de Vercel **no** está desplegando ese repositorio o esa rama.

## Causas habituales

1. **Proyecto de Vercel conectado a otro repo o fork** (nombre parecido, org distinta).
2. **Rama de producción** distinta de `main` (p. ej. `master` vacía o vieja).
3. **Integración GitHub desconectada** (revocación de permisos, cambio de org, reinstalar app de Vercel en GitHub).
4. **Solo deploys manuales** (“Redeploy”) sin nuevos eventos desde Git — la app queda en un commit viejo aunque Git avance.

## Pasos para alinear (una vez)

1. [Vercel](https://vercel.com) → proyecto **kite-prospect** (o el que use la URL de pruebas).
2. **Settings → Git**:
   - **Connected Git Repository:** debe ser **`kiteprop/ia-kiteprospects`** (mismo que `git remote`).
   - Si no coincide: **Disconnect** y **Connect** de nuevo el repo correcto (pedir acceso GitHub si hace falta).
3. **Production Branch:** `main`.
4. **Root Directory:** `apps/web` (monorepo; ver `deploy-automation-one-time-setup.md`).
5. Guardar y, en **Deployments**, disparar un deploy:
   - **Redeploy** del último commit **o**
   - un push vacío desde la máquina: `git commit --allow-empty -m "chore: trigger Vercel deploy"` y `git push origin main`.

6. Verificar que el nuevo deployment lista el **mismo commit** que GitHub `main`.

## Tras alinear

- `GET https://TU-URL-DE-PRUEBAS/api/health` → `ok: true`.
- Probar una ruta nueva (p. ej. `/dashboard/reportes` desde L3) si existía solo en código reciente.

## Referencias

- `docs/deploy-automation-one-time-setup.md`
- `docs/manual-actions-required.md`
