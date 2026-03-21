# Decisión: middleware y sesión (Auth.js v5)

## Problema (intento con `getToken` solo)

Usar **`getToken`** de `@auth/core/jwt` en el middleware sin el pipeline de NextAuth hacía que, en producción, la sesión **no se reconociera** (JWT cifrado / cookies / salt distintos al decodificado manualmente) → redirección a `/login` tras un login válido.

## Decisión actual

- Usar el patrón oficial **`export default auth((req) => { ... })`** desde `@/lib/auth`.
- La sesión se resuelve igual que en el resto de la app (petición interna coherente con cookies de Auth.js).

## Nota

El bundle del middleware puede volver a incluir dependencias pesadas y advertencias de Edge; prioridad: **login y dashboard funcionando**.

## Referencias

- `apps/web/src/middleware.ts`
