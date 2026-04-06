# Integración de inventario: KiteProp y Propieya

## Criterio estructural

- **Con KiteProp como partner principal:** el tenant consume **feeds y/o API** acordados con KiteProp (XML/JSON de export, CRM en demo/staging). Las propiedades se materializan en `Property` con `externalSource`/`externalId` cuando aplica.  
- **Sin KiteProp:** el mismo modelo `Property` debe alimentarse desde **Propieya** (URLs de export, API o feed documentado por Propieya), con **los mismos criterios de filtrado** que el ecosistema use en portales (tipología, zona, precio, estado).

**No** se menciona al usuario final la marca del origen en mensajes automáticos; a nivel **configuración** el admin define URLs y credenciales por tenant.

## URL de referencia (local / demos)

JSON público de ejemplo (estructura estable en el tiempo; el segmento del path puede variar en despliegues futuros):

`https://static.kiteprop.com/kp/difusions/f89cbd8ca785fc34317df63d29ab8ea9d68a7b1c/properstar.json`

Configuración en UI: `/dashboard/account/property-feeds`. Guía rápida: `docs/setup-local.md` § 6.

## Implementación actual (repo)

- **KiteProp / feed genérico:** `Account.config.kitepropFeed`; sync en `syncKitepropFeedForAccount` / `sync-kiteprop-feed.ts`; parsers OpenNavent / Proppit.  
- **Propieya:** no hay conector con nombre en código; **funcionalmente** es un **segundo origen de feed** configurable por `Account.config` (misma idea: URLs HTTPS por tenant, parsers acordados).  
- **CRM API KiteProp:** `KITEPROP_API_URL` / integraciones MCP y límites en `docs/decisions/kiteprop-frontera-demo-y-produccion.md`.

## Sugerencia de propiedades

- El matching usa solo filas `Property` del tenant (`score-property-match.ts`, `sync-property-matches.ts`).  
- Los **links** mostrados en UI o enviados por WhatsApp deben salir de datos reales de `Property` (título, precio, zona); si el feed trae URL pública, puede almacenarse en `metadata` o campo dedicado cuando exista.

## Coherencia de filtros

- Mantener alineados **intención** (compra/alquiler/inversión), **tipo**, **zona**, **precio**, **dormitorios** con los criterios de los portales partner.  
- **Mapa:** no es core del asistente conversacional; prioridad baja salvo decisión futura explícita.

## Manual

Altas de URLs de feed y políticas de API: `docs/manual-actions-required.md` y `docs/decisions/kiteprop-frontera-demo-y-produccion.md`.
