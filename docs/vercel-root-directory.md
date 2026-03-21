# Vercel: carpeta raíz del proyecto (monorepo)

El build de Next.js deja la carpeta **`.next`** dentro de **`apps/web`**. Vercel debe usar esa carpeta como raíz del proyecto Next.

## Qué configurar en Vercel (una vez)

1. **https://vercel.com/dashboard** → proyecto **kite-prospect** → **Settings** → **General**.
2. **Root Directory** → **Edit** → pon **`apps/web`** → **Save**.
3. **Deployments** → último deploy → **⋯** → **Redeploy** (o sube un commit nuevo).

Con eso, el archivo **`apps/web/vercel.json`** del repo define instalar y construir desde la raíz del monorepo (`cd ../.. && npm install` / `npm run build`).

Si **Root Directory** se queda en `.` (raíz del repo), Vercel buscará `.next` en el sitio equivocado y el deploy fallará con el error del directorio de salida.
