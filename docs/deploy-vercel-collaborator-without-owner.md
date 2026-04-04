# Deploy en Vercel cuando no sos owner del proyecto (colaborador en GitHub)

Si el repo **`kiteprop/ia-kiteprospects`** ya está en GitHub y el código se sube con `git push origin main`, pero **no podés reconectar Vercel** (solo el owner de la org/equipo en Vercel), estas son alternativas que el **owner** puede habilitar una vez.

## Opción A — Owner reconecta el repo en Vercel (preferida)

Quien administra el proyecto en Vercel: **Settings → Git** → conectar **`kiteprop/ia-kiteprospects`**, rama **`main`**, **Root Directory** `apps/web`.  
Después, cada `git push` a `main` dispara build. Sin esto, las otras opciones son parches.

## Opción B — Deploy Hook (disparo por URL)

1. En Vercel (quien tenga acceso): proyecto → **Settings → Git → Deploy Hooks** → crear hook para **`main`**.
2. Copiar la URL del hook (secreto en la URL).
3. **GitHub** → repo → **Settings → Secrets and variables → Actions** → crear secreto `VERCEL_DEPLOY_HOOK_URL` con esa URL.
4. El repo incluye `.github/workflows/trigger-vercel-deploy-hook.yml`: en cada push a `main` hace `POST` al hook si el secreto está definido; si no, no falla el CI.

**Nota:** el hook solo tiene sentido si el proyecto Vercel ya está conectado al repo correcto; si no, el build seguirá desactualizado.

## Opción C — GitHub Actions + Vercel CLI (`vercel deploy`)

1. Owner genera **Vercel token** y vincula proyecto (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) — ver [Vercel docs: deploy from CI](https://vercel.com/docs/deployments/deployment-methods#deploying-with-the-vercel-cli).
2. Esos valores van como **secrets** en GitHub.
3. Workflow hace checkout del repo y `vercel deploy --prod --token …` (build desde el commit del workflow, sin depender del webhook de Git en Vercel).

Útil cuando la integración Git ↔ Vercel no puede tocarse pero sí se pueden cargar secrets en el repo.

## Referencias

- `docs/deploy-automation-one-time-setup.md`
- `docs/decisions/vercel-deploy-lag-behind-github.md`
- `docs/decisions/github-official-remote-kiteprop.md`
