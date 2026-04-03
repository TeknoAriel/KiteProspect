# S34 — Reportes operativos + badge de canal en contactos

## Contexto

Continuación de **L2** (visibilidad en producto): acercamiento a **F2-E7** (mejores reportes) sin BI pesado ni exportaciones.

## Decisión

1. **Ruta** `/dashboard/reportes` (español, coherente con el resto del dashboard en ES).
2. **Datos** (`getOperationalReportsForAccount`):
   - Contactos nuevos en **7 días** (UTC desde medianoche relativa al cálculo `setUTCDate`).
   - **Atribución de canal:** primera `Conversation` del contacto por `createdAt` ascendente; sin conversación → `sin_conversacion`.
   - `groupBy` de `conversationalStage` (todos los contactos del tenant).
   - `Task` con `status = pending` vía `contact.accountId`.
   - `FollowUpSequence` con `status = active` vía `contact.accountId`.
3. **Lista de contactos:** `include` de la primera conversación (mismo criterio) y **badge** con `formatChannelLabel` (`channel-label.ts` compartido con paneles del dashboard).

## Fuera de alcance

- Export CSV/PDF, tiempos de primera respuesta, cohortes (F2-E7 posterior).

## Referencias

- `docs/roadmap.md` F2-E7.
