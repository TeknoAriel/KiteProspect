# L18 — F3-E1 CRM externo (slice: vínculo `externalId`)

**Fecha:** 2026-04-01  
**Contexto:** `PRODUCT_DEFINITION.md` Fase 3 incluye «CRM externo»; `docs/roadmap.md` F3-E1 habla de sync bidireccional o unidireccional **según decisión de negocio**. No hay API de un proveedor concreto acordada en el repo.

## Decisión

1. **Slice mínimo entregable (este sprint):** persistir y exponer el **identificador del contacto en el sistema remoto** en el campo existente `Contact.externalId`, con:
   - edición en ficha de contacto (admin/coordinador);
   - `PATCH /api/contacts/{id}/external` con la **misma autenticación que la captura** (`CAPTURE_API_SECRET` + `accountId` en cuerpo si es global, o API key `kp_…` del tenant);
   - auditoría `contact_external_id_updated`;
   - documentación en `docs/capture-integration.md` §6 y OpenAPI `openapi-capture-v1.yaml` v1.1.0.

2. **Fuera de este slice (no implementado):** sincronización periódica, OAuth con HubSpot/Salesforce, mapeo de campos, resolución de conflictos. Requiere decisión de negocio y proveedor; no se inventa aquí.

3. **Relación con F3-E3:** los webhooks salientes (`lead.captured`, `contact.assignment_changed`) siguen siendo el canal principal de **notificación** hacia sistemas externos; este slice añade **persistencia del ID** para correlación manual o integraciones custom.

## Referencias de código

- `apps/web/src/domains/crm-leads/contact-external-id.ts`
- `apps/web/src/app/api/contacts/[id]/external/route.ts`
- `apps/web/src/app/dashboard/contacts/[id]/contact-external-id-form.tsx`
