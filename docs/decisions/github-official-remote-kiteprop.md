# Repositorio oficial GitHub (organización kiteprop)

## Remoto canónico (organización / auditoría)

```
git@github.com:kiteprop/ia-kiteprospects.git
```

En el clon local suele registrarse como remoto **`kiteprop`** (ver `git-dual-remote-tekno-kiteprop.md`). Rama: **`main`**.

## Política (actualizada)

- **Trabajo diario:** `git push origin main` al repo **Tekno** (remoto `origin`), hasta que la org y Vercel queden alineados.
- **Copia en org:** `git push kiteprop main` cuando corresponda auditoría o lo pida el equipo (o `npm run git:push:kiteprop`).
- CI en **kiteprop** (`.github/workflows/`) corre cuando hay push a ese remoto; el repo Tekno puede tener su propio CI o ninguno.

## Historial

- Migración hacia org **kiteprop** para auditoría; integración Vercel puede estar desalineada → `vercel-deploy-lag-behind-github.md`, `deploy-vercel-collaborator-without-owner.md`, `git-dual-remote-tekno-kiteprop.md`.
