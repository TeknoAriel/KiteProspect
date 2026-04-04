# Vercel atrasado respecto a GitHub (diagnóstico y alineación)

## Síntoma

- En **GitHub** el último commit en `main` es reciente (p. ej. `306ccf5`) y **Actions** está verde.
- En **Vercel → Deployments** el último deploy por **git** muestra un commit **antiguo** (p. ej. marzo, mensajes tipo S21), o solo hay **Redeploy** manual.

Eso indica que **el build automático por push no está ligado al mismo repo/rama** que usás para desarrollar, o la **integración Git ↔ Vercel** quedó desactualizada.

## Comprobación rápida

| Dónde | Qué mirar |
|--------|-----------|
| Git local | `git remote -v` → **`origin`** = [TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect) (origen de deploy). |
| GitHub Tekno | Rama `main` en **TeknoAriel/KiteProspect** → último commit (hash) y fecha. |
| Vercel | Deployment → **Source** / **Git** → debe mostrar **TeknoAriel/KiteProspect** y el **mismo commit** que `main` en ese repo. |

Si el hash en Vercel **no** coincide con **Tekno** `main`, el proyecto no está conectado al repo correcto o la integración falló.

## Causas habituales

1. **Proyecto de Vercel conectado al repo equivocado** (p. ej. org `kiteprop` en lugar del origen **[TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect)**). El deploy oficial debe seguir el repo **`origin`** / Tekno — ver `git-dual-remote-tekno-kiteprop.md`.
2. **Proyecto de Vercel conectado a otro fork** (nombre parecido, org distinta).
3. **Rama de producción** distinta de `main` (p. ej. `master` vacía o vieja).
4. **Integración GitHub desconectada** (revocación de permisos, cambio de org, reinstalar app de Vercel en GitHub).
5. **Solo deploys manuales** (“Redeploy”) sin nuevos eventos desde Git — la app queda en un commit viejo aunque Git avance.

## Pasos para alinear (una vez)

1. [Vercel](https://vercel.com) → proyecto de la app (p. ej. **kite-prospect**).
2. **Settings → Git**:
   - **Connected Git Repository:** debe ser **`TeknoAriel/KiteProspect`** (mismo que `git remote` `origin` — no el repo de solo-auditoría org).
   - Si no coincide: **Disconnect** y **Connect** [TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect).
3. **Production Branch:** `main`.
4. **Root Directory:** `apps/web` (monorepo; ver `deploy-automation-one-time-setup.md`).
5. Guardar y, en **Deployments**, disparar un deploy:
   - **Redeploy** del último commit **o**
   - `git commit --allow-empty -m "chore: trigger Vercel deploy"` y **`git push origin main`** (Tekno).

6. Verificar que el deployment lista el **mismo commit** que [Tekno `main`](https://github.com/TeknoAriel/KiteProspect/commits/main).

## Tras alinear

- `GET https://TU-URL-DE-PRUEBAS/api/health` → `ok: true`.
- Probar una ruta nueva (p. ej. `/dashboard/reportes` desde L3) si existía solo en código reciente.

## Referencias

- `docs/deploy-automation-one-time-setup.md`
- `docs/manual-actions-required.md`
