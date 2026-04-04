# Git dual: trabajo diario (Tekno) + copia org (kiteprop)

## Contexto

Mientras el **owner** de la org no autoriza la integración Vercel/GitHub en `kiteprop/ia-kiteprospects`, el flujo productivo usa un remoto **Tekno** (cuenta o equipo con control total). El repo de **kiteprop** queda como **espejo bajo demanda** para auditoría y futura conexión oficial.

## Nombres de remotos (convención del repo)

| Remoto     | URL típica | Uso |
|------------|------------|-----|
| **`origin`** | Repo **Tekno** (SSH HTTPS según prefieras) | `git push` / `git pull` **diario** |
| **`kiteprop`** | `git@github.com:kiteprop/ia-kiteprospects.git` | **Solo cuando** haya que alinear la org o lo pidas explícitamente |

En este clon, `origin` se configuró apuntando al remoto que usabas antes como `origin`; el de org pasó a llamarse **`kiteprop`**.

## Configuración inicial (una vez por máquina)

Si todavía no tenés `origin` apuntando al repo Tekno:

```powershell
cd "ruta\al\Kite Prospect"
git remote add origin git@github.com:TU_USUARIO_O_ORG/TU_REPO_TEKNO.git
git fetch origin
git branch --set-upstream-to=origin/main main
```

Si el remoto `origin` ya existía con otra URL:

```powershell
git remote set-url origin git@github.com:TU_USUARIO_O_ORG/TU_REPO_TEKNO.git
git fetch origin
git branch --set-upstream-to=origin/main main
```

Comprobar:

```powershell
git remote -v
```

## Flujo diario (agente y humano)

1. Commits en `main` como siempre.
2. **`git push origin main`** → sube a **Tekno** (CI local / Actions en ese repo si aplica).

## Copiar a kiteprop (bajo demanda)

Cuando el owner lo autorice o lo pidas explícitamente:

```powershell
git push kiteprop main
```

O desde la raíz del monorepo:

```powershell
npm run git:push:kiteprop
```

(ver `package.json`).

## Notas

- Los dos remotos pueden apuntar al **mismo historial**; `kiteprop` es un push adicional del mismo `main`.
- Si `kiteprop` está vacío o desfasado, el primer `git push kiteprop main` puede requerir acordar con el owner (force solo si lo acordaron; **no** forzar por defecto).

## Referencias

- `docs/decisions/github-official-remote-kiteprop.md` — remoto canónico de la **organización** (auditoría).
- `docs/deploy-vercel-collaborator-without-owner.md` — Vercel sin ser owner.
