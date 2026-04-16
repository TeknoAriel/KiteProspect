# KiteProp API — import a Prospect y formularios web

Hay **dos flujos distintos**; no mezclarlos:

| Flujo | Dirección | Uso típico |
|--------|-----------|------------|
| **Import** (este doc + `kiteprop-rest-adapter`) | KiteProp → Prospect | Listar / sincronizar leads o mensajes en rango de fechas (GET u otro contrato de **lectura** que confirme KiteProp). |
| **Alta desde web** (Avalon u otro sitio) | Tu backend → KiteProp | **POST** con `X-API-Key`; la key **no** va en el navegador. |

La URL base es la del **tenant** (demo/staging acordado; no fijar producción en ejemplos). Los paths REST documentados por KiteProp suelen ser:

- **Consulta ligada a una propiedad:** `POST {base}/api/v1/messages` — cuerpo mínimo típico: `email`, `body`, `property_id` (ID numérico en KiteProp).
- **Contacto general sin ficha:** `POST {base}/api/v1/contacts` — típico: `first_name`, `email`, `summary`; opcionales `phone`, `last_name`, `source` (ej. `"Web Avalon"`).

Ese **POST** no sustituye al import: Prospect necesita un endpoint de **listado** (o búsqueda) con fechas si querés “últimos 7 días”. Confirmá con KiteProp si `GET` sobre `/api/v1/messages` (u otro path) devuelve colección y qué query params acepta; si solo existe creación por POST, no hay pull sin documentación adicional.

## Qué pedir a KiteProp antes de configurar el import

1. **URL base HTTPS** del entorno (staging/demo acordado).
2. **Path y método** del recurso que **lista** mensajes o contactos (no solo el POST de alta).
3. **Query o body** para filtrar por fecha (si aplica).
4. **Autenticación**: en muchos casos basta `X-API-Key` + `KITEPROP_API_KEY`; Basic solo si el tenant lo exige.
5. **Ejemplo de JSON** de respuesta (anonimizado) o OpenAPI.

Sin esto, el import no puede alinearse: ejecutá `npm run kiteprop:check-api` solo después de tener valores reales en `.env`.

## Variables obligatorias (HTTP real, import)

| Variable | Uso |
|----------|-----|
| `KITEPROP_API_BASE_URL` | Base sin barra final (alias: `KITEPROP_API_URL`). |
| `KITEPROP_API_IMPORT_PATH` | Path del **listado** para import (alias: `KITEPROP_API_LEADS_LIST_PATH`). Ejemplo de forma: `/api/v1/messages` — **solo** si KiteProp confirma que ese path admite GET/index para tu plan. |
| `KITEPROP_API_KEY` | **Recomendado:** API key; cabecera por defecto `X-API-Key` (configurable). |

**O bien** (si el tenant no usa solo API key):

| Variable | Uso |
|----------|-----|
| `KITEPROP_API_USER` | Usuario Basic Auth. |
| `KITEPROP_API_PASSWORD` | Contraseña Basic Auth. |

Debe existir **al menos** `KITEPROP_API_KEY` **o** el par usuario/contraseña.

## Opcionales

| Variable | Uso |
|----------|-----|
| `KITEPROP_API_KEY_HEADER` | Nombre de cabecera (default `X-API-Key`; HTTP trata mayúsculas como equivalentes). |
| `KITEPROP_API_HTTP_METHOD` | `GET` (default) o `POST` / `PUT`. |
| `KITEPROP_API_GET_DATE_QUERY_STYLE` | `all` (default): `from`,`to`,`from_date`,`to_date`. `pair`: solo `from` y `to`. `none`: sin fechas en query. |
| `KITEPROP_API_POST_APPEND_QUERY_TO_URL` | `true` para añadir también query de fechas en POST (por defecto POST usa solo body). |
| `KITEPROP_API_POST_FIELD_FROM` / `KITEPROP_API_POST_FIELD_TO` | Nombres de campos JSON para fechas en body (default `from` / `to`). |
| `KITEPROP_API_RESPONSE_LIST_KEYS` | Lista separada por comas de claves adicionales donde viene el array de ítems (por defecto también se buscan `messages`, `contacts`, `data`, `leads`, etc.). |

## Comandos

```bash
npm run kiteprop:check-api
npm run kiteprop:check-api -- --days=14
```

Muestra presencia de variables (sin secretos), URL final, status HTTP y **shape** del JSON (claves).

```bash
npm run kiteprop:import:last-week
```

Importa y escribe en BD si la respuesta se puede parsear y normalizar.

## Normalización

`normalize-kiteprop-api-item.ts` mapea claves habituales (`email`, `body`, `property_id` numérico, `summary`, `first_name` / `last_name`, objetos anidados `contact` / `message` / `property`). Si la API real usa otros nombres, ampliar **solo** con una muestra real (no inventar campos).

## MCP / docs internas

Si tenés un MCP o wiki de KiteProp con el endpoint oficial de **listado**, enlazalo en el ticket interno; el repo no duplica esa fuente de verdad.
