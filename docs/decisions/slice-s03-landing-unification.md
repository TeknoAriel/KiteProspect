# Decisión: patrón landing unificado (F1-E7 / Sprint S03)

## Contexto

S01 (API + validación) y S02 (widget iframe) ya cubren captura sin exponer secretos en el navegador del visitante, pero faltaba una **guía única** para implementadores de landings: cuándo usar cada patrón y snippets copy-paste.

## Decisión

1. **Un solo documento narrativo:** `docs/capture-integration.md` — se añade sección *Landings (unificación)* con tabla de decisión y enlaces a ejemplos.
2. **Ejemplos versionados en repo:** `docs/examples/` — HTML estático + handler proxy de referencia (no compila con la app; es documentación ejecutable copiada al proyecto del cliente).
3. **Canales alineados al roadmap:** sin nuevas entidades; `channel` sigue siendo `form` | `web_widget` | `landing` | `whatsapp` según `createLeadCapture`.
4. **Auditoría:** sin cambios; `via` sigue `public_lead_form` (formulario server action) o `api_contacts_create` (HTTP con secreto).

## Referencias

- `docs/capture-integration.md` § Landings
- `docs/examples/README.md`
