import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoints operativos internos: `Authorization: Bearer <INTERNAL_OPS_SECRET>`
 * o cabecera `x-internal-secret` (misma clave). Si no hay secreto en env, 503.
 */
export function requireInternalOpsAuth(request: NextRequest): NextResponse | null {
  const expected =
    process.env.INTERNAL_OPS_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "INTERNAL_OPS_SECRET o CRON_SECRET no configurado" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const bearer =
    auth?.startsWith("Bearer ") ? auth.slice(7).trim() : undefined;
  const header = request.headers.get("x-internal-secret")?.trim();
  const token = bearer || header;
  if (!token || token !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return null;
}
