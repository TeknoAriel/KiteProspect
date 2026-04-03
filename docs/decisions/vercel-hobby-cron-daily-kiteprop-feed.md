# Vercel Hobby: cron diario para feed KiteProp

## Contexto

En el plan **Hobby** de Vercel, cada cron configurado solo puede ejecutarse **como máximo una vez por día**. Expresiones como `0 */6 * * *` (cada 6 h) hacen **fallar el deploy** con un error de límite de cron.

## Decisión

- En **Vercel Hobby**, cada cron configurado solo puede ejecutarse **como máximo una vez por día**; expresiones más frecuentes suelen **fallar el deploy**.
- El repo usa **`0 2 */2 * *`** para `/api/cron/kiteprop-property-feed` (≈ cada **2 días**, 02:00 UTC en días impares del mes — ver `docs/decisions/slice-s32-kiteprop-incremental-json-cron.md`). Suele ser compatible con **Hobby**; si aun así falla el deploy, usar **`0 2 * * *`** (1×/día) o solo **sync manual**.
- Para **cada 30 minutos** u otra cadencia alta, suele hacer falta **Pro** y cambiar el schedule en `vercel.json`.
- El cron de seguimientos (`/api/cron/follow-up-due`) permanece en horario distinto (`0 13 * * *`).

## Implementado

- Límite Hobby documentado; schedule en `vercel.json` alineado a fase de prueba (~2 días).

## Pendiente

- Ninguno obligatorio; opcional: monitorizar duración del sync si el catálogo crece mucho.
