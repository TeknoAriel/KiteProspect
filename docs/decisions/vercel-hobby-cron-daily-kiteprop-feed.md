# Vercel Hobby: cron diario para feed KiteProp

## Contexto

En el plan **Hobby** de Vercel, cada cron configurado solo puede ejecutarse **como máximo una vez por día**. Expresiones como `0 */6 * * *` (cada 6 h) hacen **fallar el deploy** con un error de límite de cron.

## Decisión

- En `apps/web/vercel.json`, el path `/api/cron/kiteprop-property-feed` usa **`0 2 * * *`** (una vez al día, ~02:00 UTC; precisión dentro de la hora según documentación Vercel en Hobby).
- El cron de seguimientos (`/api/cron/follow-up-due`) permanece en horario distinto (`0 13 * * *`) para no solapar carga innecesaria en el mismo minuto.
- **Actualización más frecuente:** el admin puede usar **sync manual** desde `/dashboard/account/property-feeds` (`POST` ya existente) o subir a **Pro** y cambiar el schedule en `vercel.json` si el negocio lo exige.

## Implementado

- Schedule ajustado en `vercel.json`; docs S22 y hub de cuenta alineados al texto “1×/día”.

## Pendiente

- Ninguno obligatorio; opcional: monitorizar duración del sync si el catálogo crece mucho.
