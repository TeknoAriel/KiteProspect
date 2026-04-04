# L4 — F2-E1: perfil inferido (heurísticas) + prioridad declarado/inferido

## Contexto

`docs/roadmap.md` **F2-E1** — perfil inferido con IA + reglas; `SearchProfile.source = inferred`, `confidence`.

## Decisión

1. **Inferencia v1 sin LLM:** reglas sobre texto concatenado de mensajes **entrantes** (`infer-search-profile-heuristics.ts`). Español; señales: intención, tipo, zona, precios (mil/millones), dormitorios/baños.
2. **Persistencia:** `upsert` de una fila `SearchProfile` con `source: "inferred"`, `confidence` 0–1, `extra` con `{ inferenceMethod: "heuristic_v1", signals: string[] }`.
3. **Prioridad para matching y scoring:** el perfil **declarado** gana sobre el **inferido** (`selectPreferredSearchProfile`). Misma regla para **etapa conversacional** (`refreshConversationalStageForContact`).
4. **UI:** `/dashboard/contacts/[id]/profile` — botón **Inferir desde mensajes entrantes**; tarjeta del perfil usado en matching; si coexisten declarado e inferido, segundo bloque con el último inferido (solo lectura).
5. **IA inbox:** si **no** hay fila `declared` y sí existe inferido, `plan-next-conversation-action` añade una línea compacta con el JSON inferido al prompt del modelo.
6. **Auditoría / logs:** `contact_search_profile_inferred`, `logStructured` con `signalsCsv`.

## Fuera de alcance (F2-E1 siguiente paso)

- Inferencia con LLM estructurada y merge con conflictos.
- Re-inferencia automática en cada mensaje (riesgo de ruido y costo).

## Referencias

- `docs/domain-model.md` SearchProfile.
- `PRODUCT_DEFINITION.md` Fase 2.
