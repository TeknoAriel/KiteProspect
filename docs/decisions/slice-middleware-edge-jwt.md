# Decisión: middleware en Edge sin importar `auth` / bcrypt

## Problema

`middleware.ts` importaba `auth()` desde `@/lib/auth`, lo que arrastraba **bcrypt** y **jose** al bundle de Edge y generaba advertencias de build.

## Decisión

- El middleware solo valida sesión JWT y lee **`accountId`** del token.
- Usar **`getToken`** de `@auth/core/jwt` con `AUTH_SECRET` (misma sesión que emite NextAuth).
- No importar `@/lib/auth` en el middleware.

## Referencias

- `apps/web/src/middleware.ts`
