# Diagnóstico: sitio en Vercel devuelve 404

**Fecha:** 2026-04-02

## Síntoma

Abrir `https://TU-PROYECTO.vercel.app/` (o la URL que creías correcta) muestra **404 Not Found** en todo el sitio.

## Comprobaciones (orden)

1. **¿Es la URL del deployment activo?**  
   Vercel → **Project** → **Deployments** → último en **Ready** → **Visit**. Copiar esa URL. Los nombres `*.vercel.app` pueden cambiar si se creó otro proyecto o se eliminó el anterior.

2. **Root Directory del proyecto**  
   **Settings → General → Root Directory** debe ser **`apps/web`** (monorepo Next.js en `apps/web`). Si está vacío o en la raíz del repo sin configuración equivalente, el build puede no generar la app Next correcta.

3. **Build**  
   En el deployment fallido, revisar logs: `build:vercel` debe completar (migraciones + seed + `next build`). Si falla, no hay app servida → a veces 404 en el edge.

4. **Health interno (cuando la app ya responde)**  
   `GET /api/health` — JSON con estado de BD y demo; útil para distinguir “app viva” vs “ruta inexistente”.

5. **No confundir con 404 de otra capa**  
   Dominio mal enlazado, proyecto archivado, o URL de otro equipo.

## Referencias

- `docs/decisions/vercel-build-migrations-seed.md`
- `apps/web/vercel.json` (`buildCommand` / `installCommand` desde monorepo)
- `README.md` — sección deploy Vercel
