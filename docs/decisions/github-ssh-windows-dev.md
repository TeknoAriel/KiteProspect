# GitHub — SSH en Windows (desarrollo local)

**Fecha:** 2026-04-01  
**Contexto:** `git push` / `git fetch` contra repos `git@github.com:…` (p. ej. **TeknoAriel/KiteProspect** u org **kiteprop**) requerían autenticación SSH; en Windows sin clave registrada en GitHub aparecía `Permission denied (publickey)`.

## Decisión

Usar **clave dedicada Ed25519** para GitHub (no la clave por defecto del sistema si hubiera conflicto) y **`~/.ssh/config`** con `Host github.com`, `IdentityFile` apuntando a la **privada** y `IdentitiesOnly yes`. Los remotos SSH del monorepo son los de **`git-dual-remote-tekno-kiteprop.md`** (`origin` Tekno + `kiteprop` org).

## Implementado (máquina de desarrollo)

| Elemento | Valor / ubicación |
|----------|-------------------|
| Par de claves | `%USERPROFILE%\.ssh\id_ed25519_github` (privada) y `id_ed25519_github.pub` (pública) |
| Config SSH | `%USERPROFILE%\.ssh\config` — bloque `Host github.com` con `IdentityFile` y `IdentitiesOnly yes` |
| Verificación | `ssh -T git@github.com` → mensaje de éxito de GitHub; `git fetch origin` OK |

## Bloqueado por acción humana (una vez)

Registrar en GitHub la **clave pública** (contenido completo del `.pub`): [Settings → SSH and GPG keys](https://github.com/settings/keys). **No** commitear ni compartir la clave privada.

Pasos enumerados: `docs/manual-actions-required.md` (ítem 13).

## Pendiente

- Nada técnico en repo: Vercel sigue usando integración GitHub en la nube; esta decisión cubre solo **CLI local en Windows**.

## Referencias

- URLs y flujo Git: `docs/accesos-y-configuracion-git-neon-vercel.md` §1 (Git).
