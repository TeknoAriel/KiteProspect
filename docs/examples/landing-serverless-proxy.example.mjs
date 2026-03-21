/**
 * Referencia: proxy serverless que llama a Kite Prospect (POST /api/contacts/create).
 * Canal: "landing" — conversaciones etiquetadas como landing en inbox.
 *
 * No forma parte del build del monorepo; copia a tu proyecto de landing (Vercel, Netlify, etc.).
 *
 * Variables de entorno en el hosting del cliente:
 *   KITE_BASE_URL       — ej. https://tu-app-kite.vercel.app (sin barra final)
 *   CAPTURE_API_SECRET  — el mismo valor que en Kite (no exponer al navegador)
 *   KITE_ACCOUNT_SLUG   — opcional; default "demo"
 *
 * Ajusta la firma del handler a tu runtime (Vercel Node, Netlify Functions, etc.).
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const base = process.env.KITE_BASE_URL?.replace(/\/$/, "");
  const secret = process.env.CAPTURE_API_SECRET?.trim();
  const accountSlug = (process.env.KITE_ACCOUNT_SLUG || "demo").trim();

  if (!base || !secret) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Falta KITE_BASE_URL o CAPTURE_API_SECRET en el servidor" }));
    return;
  }

  /** Parseo mínimo: JSON o application/x-www-form-urlencoded */
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      const params = new URLSearchParams(body);
      body = Object.fromEntries(params.entries());
    }
  }

  const r = await fetch(`${base}/api/contacts/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      accountSlug,
      email: body.email,
      phone: body.phone,
      name: body.name,
      message: body.message,
      channel: "landing",
    }),
  });

  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  res.statusCode = r.status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
