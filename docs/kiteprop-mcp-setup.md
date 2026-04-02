# MCP de KiteProp — configuración para todos los proyectos

Objetivo: usar el servidor [kiteprop/crm-mcp](https://github.com/kiteprop/crm-mcp) en **cualquier carpeta o repo** que abras en Cursor, sin copiar secretos a cada proyecto.

## Recomendado: MCP global de Cursor

Cursor lee un `mcp.json` en tu perfil de usuario. Ahí va **una sola vez** la URL y el token.

| Sistema | Ruta |
|--------|------|
| **Windows** | `%USERPROFILE%\.cursor\mcp.json` → p. ej. `C:\Users\TuUsuario\.cursor\mcp.json` |
| **macOS** | `~/.cursor/mcp.json` |
| **Linux** | `~/.cursor/mcp.json` |

1. Abrí o creá **`%USERPROFILE%\.cursor\mcp.json`** (Windows) o **`~/.cursor/mcp.json`** (Mac/Linux).
2. Copiá el JSON de plantilla desde este repo: [`.mcp.json.example`](../.mcp.json.example) o [`docs/templates/kiteprop-cursor-mcp.json.example`](./templates/kiteprop-cursor-mcp.json.example) **en ese archivo de usuario** (no en la raíz del repo). Reemplazá `REEMPLAZAR_CON_TU_CLAVE_kp_` por tu clave personal de KiteProp.
3. Reiniciá Cursor o **Developer: Reload Window** si el servidor no aparece.
4. Comprobá en **Settings → MCP** que `kiteprop` figure sin error.

**Ventaja:** los repos **no** necesitan `.mcp.json` con secretos; `.mcp.json` del proyecto puede omitirse o usarse solo para otros MCP.

## Si el global no te lo toma el agente

Algunas versiones de Cursor priorizan MCP por proyecto. Entonces, en **ese** repo:

- Copiá la misma entrada `kiteprop` a **`.mcp.json` en la raíz del proyecto** (igual que `.mcp.json.example`), o
- A `.cursor/mcp.json` del proyecto, según lo que muestre tu versión de Cursor en Settings → MCP.

Mantener el token **fuera de Git**: el archivo local con clave debe estar en `.gitignore` (en Kite Prospect, `.mcp.json` ya está ignorado).

## Variables

| Variable | Uso |
|----------|-----|
| `KITEPROP_API_URL` | Base del CRM (por defecto `https://www.kiteprop.com`). |
| `KITEPROP_API_TOKEN` | Clave personal `kp_…` (por usuario; define la organización). |

## Comprobar API sin MCP

Desde PowerShell (lee tu `.cursor\mcp.json`):

```powershell
$p = "$env:USERPROFILE\.cursor\mcp.json"
$j = Get-Content -Raw $p | ConvertFrom-Json
$base = $j.mcpServers.kiteprop.env.KITEPROP_API_URL.TrimEnd('/')
$key = $j.mcpServers.kiteprop.env.KITEPROP_API_TOKEN
Invoke-RestMethod -Uri "$base/api/v1/profile" -Headers @{ "X-API-Key" = $key } -Method Get
```

Si `success` es `true`, la clave y la URL son válidas.

## Seguridad

- No commitees tokens. Rotá la clave en KiteProp si se filtró (chat, captura, etc.).
- Este documento **no** contiene claves reales.

## Referencias en este monorepo

- Plantilla sin secretos: [`.mcp.json.example`](../.mcp.json.example) (raíz) y [`docs/templates/kiteprop-cursor-mcp.json.example`](./templates/kiteprop-cursor-mcp.json.example).
- Checklist humano: [manual-actions-required.md](./manual-actions-required.md) §9.
