# L17 — F3-E6 reporting: cohorte 7d + ventana 7/14/30

## Alcance (MVP)

- **Cohorte de altas:** cuatro ventanas consecutivas de 7 días (UTC) hacia atrás desde “ahora”: últimos 7 días, 8–14, 15–21, 22–28. Misma semántica en UI (`/dashboard/reportes`) y CSV (`cohorte_7d` + `cohorte_7d_rango_utc`).
- **Ventana del reporte principal:** selector `?days=7|14|30` en reportes y en `GET /api/exports/operational-reports?days=` (nuevos contactos, SLA, tablas por canal/embudo).

## No objetivo

- BI / dashboards infinitos, atribución multi-touch, cohortes por propiedad.

## Referencias

- `get-operational-reports.ts`, `operational-reports-period.ts`, `operational-reports-csv.ts`.
