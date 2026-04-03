# Vercel Hobby: cron diario para feed KiteProp

## Contexto

En el plan **Hobby** de Vercel, cada cron configurado solo puede ejecutarse **como máximo una vez por día**. Expresiones como `0 */6 * * *` (cada 6 h) hacen **fallar el deploy** con un error de límite de cron.

## Decisión

- En **Vercel Hobby**, cada cron configurado solo puede ejecutarse **como máximo una vez por día**; expresiones más frecuentes suelen **fallar el deploy**.
- El repo apunta a **producción con alta frecuencia** usando **`*/30 * * * *`** en `apps/web/vercel.json` para `/api/cron/kiteprop-property-feed` (ver `docs/decisions/slice-s32-kiteprop-incremental-json-cron.md`). Eso **requiere plan Pro** (o equivalente que permita crons cada 30 min).
- Si el proyecto sigue en **Hobby** y el deploy falla por el cron, sustituir temporalmente por **`0 2 * * *`** (1×/día UTC) o usar solo **sync manual** desde `/dashboard/account/property-feeds`.
- El cron de seguimientos (`/api/cron/follow-up-due`) permanece en horario distinto (`0 13 * * *`).

## Implementado

- Límite Hobby documentado; schedule “objetivo producción” en `vercel.json` (30 min) sujeto al plan de Vercel.

## Pendiente

- Ninguno obligatorio; opcional: monitorizar duración del sync si el catálogo crece mucho.
