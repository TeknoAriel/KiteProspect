# L5 — F2-E2: matching mejorado (pesos, feedback, exclusiones)

## Contexto

`docs/roadmap.md` **F2-E2** — matching con pesos, exclusiones y feedback del usuario sobre matches.

## Decisión

1. **Pesos por dimensión (cuenta):** `Account.config.matchingWeights` — objeto `{ intent, type, zone, price, bedrooms }` con enteros ≥ 0; el servidor **normaliza** a suma 100. Por defecto 20 cada uno (equivalente a v0). Lectura/escritura: `GET/PATCH /api/account/matching-config` (solo admin); UI `/dashboard/account/matching`.
2. **Scoring de match:** `scorePropertyAgainstProfile` recibe `weights` opcional; cada dimensión usa su peso como techo de puntos (mismas proporciones relativas que v0 dentro de la dimensión).
3. **Exclusiones por contacto:** `SearchProfile.extra.excludedPropertyIds` — array de IDs de `Property` (cuid). UI en perfil declarado: campo de texto (coma). El JSON “extra” no debe duplicar `excludedPropertyIds` (se gestiona solo con el campo dedicado al guardar).
4. **Feedback en `PropertyMatch`:** valores `interested` | `not_interested` | `viewed` | `null`. UI en ficha contacto. **`not_interested`:** el sync **no** elimina esa fila ni recalcula score para esa propiedad hasta que el feedback cambie.
5. **Trazas:** `property_matches_synced` con `rulesVersion: "v1"`; auditoría `account_matching_weights_updated`, `property_match_feedback_updated`.

## Pendiente (backlog)

- Pesos por tipo de propiedad o zona comercial (reglas más ricas).
- Feedback que ajuste pesos automáticamente (no en MVP).

## Referencias

- `docs/roadmap.md` F2-E2.
- `docs/decisions/slice-s04-matching-v0.md` (base v0).
