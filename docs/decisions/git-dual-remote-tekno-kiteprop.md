# Git dual: Tekno (origen + Vercel) + kiteprop (auditoría)

## Repositorios

| Rol | Repo GitHub | Remoto local | Uso |
|-----|-------------|----------------|-----|
| **Origen de trabajo y deploy** | **[TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect)** | **`origin`** | `git push origin main` diario; **Vercel debe estar conectado a este repo**. |
| **Copia org (auditoría)** | [kiteprop/ia-kiteprospects](https://github.com/kiteprop/ia-kiteprospects) | **`kiteprop`** | `git push kiteprop main` o `npm run git:push:kiteprop` **cuando pidan auditoría** (no reemplaza el flujo Tekno). |

**SSH (Tekno):** `git@github.com:TeknoAriel/KiteProspect.git`

## Vercel ↔ Git (oficial para esta app)

1. En [Vercel](https://vercel.com) → proyecto de **Kite Prospect** → **Settings → Git**.
2. **Connected Git Repository** = **`TeknoAriel/KiteProspect`** (mismo que `origin`).
3. **Production Branch:** `main`.
4. **Root Directory:** `apps/web` (ver `deploy-automation-one-time-setup.md`).

Cada `git push` a `main` en **Tekno** dispara build. El repo **kiteprop** no tiene por qué estar conectado a Vercel para el día a día.

## Remotos en el clon

```text
origin    → git@github.com:TeknoAriel/KiteProspect.git
kiteprop  → git@github.com:kiteprop/ia-kiteprospects.git
```

La rama `main` sigue a **`origin/main`** (Tekno).

## Configuración inicial en otra máquina

```powershell
git clone git@github.com:TeknoAriel/KiteProspect.git
cd KiteProspect
git remote add kiteprop git@github.com:kiteprop/ia-kiteprospects.git
```

(Si el clon ya existe solo con `kiteprop`, agregar `origin` con la URL Tekno y `git branch --set-upstream-to=origin/main main`.)

## Flujo diario

1. Commits en `main`.
2. **`git push origin main`** → GitHub Tekno + (si Vercel está bien conectado) deploy automático.

## Copia a kiteprop (auditoría)

```powershell
git push kiteprop main
```

o:

```powershell
npm run git:push:kiteprop
```

## Notas

- Los dos remotos suelen llevar el **mismo `main`**; `kiteprop` es un push explícito cuando la org necesita revisar el código.
- **No** forzar push a `kiteprop` sin acordar con quien administra la org.

## Referencias

- `docs/deploy-automation-one-time-setup.md` — Root `apps/web`, variables, build.
- `docs/decisions/github-official-remote-kiteprop.md` — rol del repo org.
- `docs/deploy-vercel-collaborator-without-owner.md` — si alguien sin acceso a Vercel necesita disparar deploys.
