# Decisión: matching v0 con inventario real (F1-E14 / Sprint S04)

## Contexto

`PRODUCT_DEFINITION.md` exige **matching v0** desde reglas sobre inventario, sin inventar propiedades. El modelo ya tenía `PropertyMatch` y el fit score leía matches existentes, pero **no había servicio** que los calculara desde `SearchProfile` + `Property`.

## Decisión

1. **Reglas puras** en `apps/web/src/domains/matching/services/score-property-match.ts`:
   - Cinco dimensiones de 0–20 puntos: intención, tipo, zona, precio, dormitorios → suma acotada a **0–100**.
   - Solo propiedades con `status === "available"`.
   - Intención: `compra` ↔ listado `venta`; `renta` ↔ `renta`; `inversión` acepta ambos con ligera penalización.
   - Zona: normalización minúsculas/sin acentos; igualdad o subcadena.
   - Precio: respeta `minPrice` / `maxPrice` del perfil si existen.
   - Dormitorios: la propiedad debe cubrir lo pedido (`>=`).

2. **Persistencia** en `sync-property-matches.ts`:
   - Requiere al menos un `SearchProfile` para el contacto.
   - Borra todos los `PropertyMatch` del contacto y vuelve a crear filas con `score >= MIN_PROPERTY_MATCH_SCORE` (**30**).
   - Motivo breve en `reason` (truncado en servicio si hiciera falta).

3. **UI:** botón **Recalcular matches** en ficha de contacto (`RecalculateMatchesButton`).

4. **Auditoría:** `property_matches_synced` con `matchedCount`, `inventoryCount`, `rulesVersion: "v0"`.

5. **Casos de referencia** exportados en `MATCHING_SCORE_CASES` (documentación; sin runner de tests en CI).

## Fuera de alcance (Fase 2+)

- Pesos configurables por cuenta, feedback del usuario en matches, ML.

## Referencias

- `apps/web/src/domains/matching/services/score-property-match.ts`
- `apps/web/src/domains/matching/services/sync-property-matches.ts`
- `docs/domain-model.md` (PropertyMatch)
