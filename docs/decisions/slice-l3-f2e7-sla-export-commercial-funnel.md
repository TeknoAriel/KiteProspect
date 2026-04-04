# L3 — F2-E7: SLA primera respuesta, embudo comercial y export CSV

## Contexto

Continuación de **F2-E7** (mejores reportes) tras S34, sin BI pesado ni cohortes.

## Prioridad (criterio)

1. **SLA / tiempos de respuesta** — datos ya existen en `Message` (`direction` inbound/outbound); valor inmediato para operación.
2. **Embudo comercial** en la misma pantalla que el conversacional — mismo patrón `groupBy`, sin nueva entidad.
3. **Export CSV** — un solo archivo descargable para compartir con socios; UTF-8 con BOM para Excel.

## Decisiones

### Primera respuesta (mediana y promedio)

- Por **conversación**: `t_in` = primer `Message` `inbound`; `t_out` = primer `outbound` con `createdAt > t_in`.
- **Ventana:** solo conversaciones cuya **primera entrada** (`t_in`) cae en el mismo período UTC que “nuevos contactos” (7 días por defecto).
- Métricas: mediana y promedio de `(t_out - t_in)` en minutos; conteos de hilos con entrada en período y con al menos una respuesta.

### Embudo comercial

- `Contact.commercialStage` agregado con `groupBy` (todos los contactos del tenant), análogo al embudo conversacional en reportes.

### CSV

- Ruta `GET /api/exports/operational-reports` (sesión requerida); mismo dataset que la página.
- Columnas: `seccion`, `clave`, `valor` (filas largas; fácil de pivotear o filtrar en hoja de cálculo).

## Fuera de alcance (F2-E7 posterior)

- Conversión por canal con modelo de atribución multi-toque.
- SLA por asesor o por horario laboral (timezone de cuenta).
- Export PDF.

## Referencias

- `docs/roadmap.md` F2-E7.
- `docs/decisions/slice-s34-reports-and-contact-channel-badge.md`.
