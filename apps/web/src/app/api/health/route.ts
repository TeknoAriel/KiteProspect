/**
 * Diagnóstico público (sin secretos): comprueba conexión a BD y existencia del demo.
 * Útil cuando el login falla: si demoUser es false, falta seed en esta base.
 */
import { NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("[health] db", e);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        hint: "Revisa DATABASE_URL en Vercel y que Neon esté activo.",
      },
      { status: 503 },
    );
  }

  const demoAccount = await prisma.account.findUnique({
    where: { slug: "demo" },
    select: { id: true, status: true },
  });

  const demoUser = demoAccount
    ? await prisma.user.findFirst({
        where: { accountId: demoAccount.id, email: "admin@demo.local" },
        select: { id: true, status: true },
      })
    : null;

  return NextResponse.json({
    ok: true,
    database: "connected",
    demoAccount: !!demoAccount,
    demoAccountStatus: demoAccount?.status ?? null,
    demoUser: !!demoUser,
    demoUserStatus: demoUser?.status ?? null,
    hint:
      !demoAccount || !demoUser
        ? "En tu PC ejecuta contra la MISMA DATABASE_URL que Vercel: npm run db:migrate:deploy && npm run db:seed"
        : demoUser?.status !== "active" || demoAccount?.status !== "active"
          ? "Cuenta o usuario inactivo en BD."
          : "Demo listo: el login debería funcionar con demo / admin@demo.local / demo123",
  });
}
