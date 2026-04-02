# MCP de KiteProp — configuración para todos los proyectos

Objetivo: usar el servidor [kiteprop/crm-mcp](https://github.com/kiteprop/crm-mcp) en **cualquier carpeta o repo** que abras en Cursor, sin copiar secretos a cada proyecto.

**Política del monorepo Kite Prospect:** no usar como valor por defecto la web/API de **producción** de la plataforma KiteProp (`www.kiteprop.com` y subdominios operativos). Configurá **`KITEPROP_API_URL`** con la **base de API demo/staging** que acuerde el equipo (ver `docs/decisions/kiteprop-frontera-demo-y-produccion.md`).

## Recomendado: MCP global de Cursor

Cursor lee un `mcp.json` en tu perfil de usuario. Ahí va **una sola vez** la URL y el token.

| Sistema | Ruta |
|--------|------|
| **Windows** | `%USERPROFILE%\.cursor\mcp.json` → p. ej. `C:\Users\TuUsuario\.cursor\mcp.json` |
| **macOS** | `~/.cursor/mcp.json` |
| **Linux** | `~/.cursor/mcp.json` |

1. Abrí o creá **`%USERPROFILE%\.cursor\mcp.json`** (Windows) o **`~/.cursor/mcp.json`** (Mac/Linux).
2. Copiá el JSON de plantilla desde este repo: [`.mcp.json.example`](../.mcp.json.example) o [`docs/templates/kiteprop-cursor-mcp.json.example`](./templates/kiteprop-cursor-mcp.json.example) **en ese archivo de usuario** (no en la raíz del repo).
3. Completá **`KITEPROP_API_URL`** con la URL base de la API acordada (termina sin `/`; ejemplo de forma: `https://api-demo.tu-equipo.com` — **no** uses producción pública sin aprobación explícita).
4. Reemplazá **`KITEPROP_API_TOKEN`** por tu clave personal (`kp_…`).
5. Reiniciá Cursor o **Developer: Reload Window** si el servidor no aparece.
6. Comprobá en **Settings → MCP** que `kiteprop` figure sin error.

**Ventaja:** los repos **no** necesitan `.mcp.json` con secretos; `.mcp.json` del proyecto puede omitirse o usarse solo para otros MCP.

## Si el global no te lo toma el agente

Algunas versiones de Cursor priorizan MCP por proyecto. Entonces, en **ese** repo:

- Copiá la misma entrada `kiteprop` a **`.mcp.json` en la raíz del proyecto** (igual que `.mcp.json.example`), o
- A `.cursor/mcp.json` del proyecto, según lo que muestre tu versión de Cursor en Settings → MCP.

Mantener el token **fuera de Git**: el archivo local con clave debe estar en `.gitignore` (en Kite Prospect, `.mcp.json` ya está ignorado).

## Variables

| Variable | Uso |
|----------|-----|
| `KITEPROP_API_URL` | Origen base de la API REST (ej. `https://…/…` **sin** `/` final). Debe ser el entorno **demo/staging** acordado; ver política arriba. Si queda vacío, el cliente del MCP cae en `http://localhost` (solo desarrollo). |
| `KITEPROP_API_TOKEN` | Clave personal `kp_…` (por usuario; define la organización en el CRM). |

## Comprobar API sin MCP

Solo si **`KITEPROP_API_URL`** está definida y no vacía:

```powershell
$p = "$env:USERPROFILE\.cursor\mcp.json"
$j = Get-Content -Raw $p | ConvertFrom-Json
$rawUrl = $j.mcpServers.kiteprop.env.KITEPROP_API_URL
$base = if ($null -ne $rawUrl -and "$rawUrl".Trim() -ne "") { "$rawUrl".Trim().TrimEnd('/') } else { "" }
$key = $j.mcpServers.kiteprop.env.KITEPROP_API_TOKEN
if (-not $base) { throw "Definí KITEPROP_API_URL en mcp.json" }
Invoke-RestMethod -Uri "$base/api/v1/profile" -Headers @{ "X-API-Key" = $key } -Method Get
```

Si `success` es `true`, la clave y la URL son válidas para ese entorno.

## Seguridad

- No commitees tokens. Rotá la clave si se filtró (chat, captura, etc.).
- Este documento **no** contiene claves reales.

## Referencias en este monorepo

- Plantilla sin secretos: [`.mcp.json.example`](../.mcp.json.example) (raíz) y [`docs/templates/kiteprop-cursor-mcp.json.example`](./templates/kiteprop-cursor-mcp.json.example).
- Checklist humano: [manual-actions-required.md](./manual-actions-required.md) §9.
- Frontera demo/producción: [kiteprop-frontera-demo-y-produccion.md](./decisions/kiteprop-frontera-demo-y-produccion.md).
