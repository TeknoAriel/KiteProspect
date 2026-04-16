# Modelo de datos: fuentes KiteProp (JSON feed + API key)

**Ámbito:** cómo Prospect **materializa** inventario y operación CRM cuando las fuentes principales son el **export JSON** (difusión estática) y la **API REST** autenticada (`X-API-Key` / token `kp_…`). No duplica la documentación OpenAPI de KiteProp; describe el **mapeo a tablas** de este monorepo.

---

## Vista en capas

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│ Feed HTTPS (JSON/XML)       │     │ REST CRM /api/v1/…           │
│ sin credencial en Prospect  │     │ KITEPROP_API_KEY + base URL  │
└──────────────┬──────────────┘     └──────────────┬───────────────┘
               │ ingestión periódica / manual        │ import validación / MCP
               ▼                                   ▼
     Property (+ metadata)                Contact.metadata
     columnas + fingerprint                + Lead + Conversation
     + metadata.kiteprop.rawRecord              + Message + LeadReplyDraftReview
```

- **Inventario:** una fila `Property` por aviso (`externalSource = kiteprop`, `externalId` = id numérico del export).
- **Personas y conversación API:** `Contact`, `Lead`, `Conversation`, `Message`; trazabilidad de sync en `KitepropLeadSyncRun` / cursor; revisión en `LeadReplyDraftReview`.
- **Raw para consultas SQL/JSON:** sin crear decenas de columnas nuevas: snapshot en JSON indexable (`metadata`).

---

## 1. Feed JSON (externalsite / Proppit / OpenNavent)

| Origen | Destino en BD | Notas |
|--------|----------------|-------|
| Objeto aviso (array raíz o `properties` / …) | `FeedListing` → `Property` | Parser: `parse-proppit-json.ts` |
| Campos escalares (título, precio, zonas) | Columnas `Property` | Ver `sync-kiteprop-feed.ts` |
| Objeto completo del aviso | `Property.metadata.kiteprop.rawRecord` | Solo shape **kiteprop_json** (detectado por `for_sale` / `for_rent` / `last_update` + `property_type`) |
| Formato / URL pública | `metadata.kiteprop.feedFormat`, `metadata.kiteprop.publicUrl` | Trazabilidad |

**Columnas principales usadas:** `title`, `description`, `intent`, `price`, `zone`, `address`, `city`, `province`, `country`, `status` (canon: available, reserved, sold, rented, withdrawn), `surfaceTotal` / `surfaceCovered`, `rooms`, coordenadas, `externalFeedUpdatedAt`.

**Fingerprint** (`importFingerprint`): hash de campos del `FeedListing` para evitar escrituras si no cambió el aviso.

**Consultas:** filtros por columnas; para campos solo en export (p. ej. `agency`, `agent`), usar `metadata` → `rawRecord` en PostgreSQL (`->` / `@>`).

---

## 2. API REST (import / MCP)

| Rol | Tablas |
|-----|--------|
| Ejecución de import | `KitepropLeadSyncRun`, `KitepropLeadSyncCursor` |
| Persona | `Contact` — columnas `email`, `phone`, `name`, `externalId`; **`metadata.kitepropApi`** con `lastImportedAt` + `sourceSnapshot` (payload `raw` del ítem API) |
| Oportunidad | `Lead` (`source: kiteprop_api`) |
| Hilo | `Conversation`, `Message` |
| Validación humana | `LeadReplyDraftReview` |
| Dedup | `IngestionIdempotencyKey` (`source: kiteprop_rest`) |

Normalización intermedia: `NormalizedKitepropImport` (`normalize-kiteprop-api-item.ts`).

---

## 3. Convenciones `metadata`

### `Property.metadata`

- **`kiteprop.claveReferencia`**: referencia humana si existe.
- **`kiteprop.feedFormat`**: `proppit` \| `kiteprop_json` \| `opennavent_xml`.
- **`kiteprop.publicUrl`**: URL pública de ficha.
- **`kiteprop.rawRecord`**: snapshot del objeto JSON del feed (KiteProp externalsite).

### `Contact.metadata`

- **`kitepropApi.lastImportedAt`**: ISO 8601.
- **`kitepropApi.sourceSnapshot`**: objeto crudo devuelto por la API en el último import (para campos no mapeados a columnas).

---

## 4. Coherencia con el producto

- No se inventan propiedades: todo sale del feed o de filas `Property` existentes.
- La API no reemplaza al feed para el inventario en matching: el **matching** usa `Property` alimentada por feed; la API complementa **contactos / mensajes** importados y operación (ver `docs/kiteprop-kite-prospect-flow-examples.md`).

---

## Referencias de código

- Feed: `parse-proppit-json.ts`, `sync-kiteprop-feed.ts`, `kiteprop-feed-types.ts`
- API: `kiteprop-rest-adapter.ts`, `ingest-kiteprop-api-record.ts`, `normalize-kiteprop-api-item.ts`
- Env import: `docs/kiteprop-api-import-setup.md`
