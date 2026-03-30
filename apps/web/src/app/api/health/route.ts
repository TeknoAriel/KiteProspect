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

  const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
  const authSecretConfigured = authSecret.length > 0;
  /** NextAuth recomienda secreto fuerte; si falta o es corto, las sesiones JWT fallan o se invalidan al redeploy. */
  const authSecretLongEnough = authSecret.length >= 32;

  const demoAccount = await prisma.account.findUnique({
    where: { slug: "demo" },
    select: { id: true, status: true },
  });

  const demoUserRow = demoAccount
    ? await prisma.user.findFirst({
        where: {
          accountId: demoAccount.id,
          email: { equals: "admin@demo.local", mode: "insensitive" },
        },
        select: { id: true, status: true, password: true },
      })
    : null;

  const demoUser = !!demoUserRow;
  const pwd = demoUserRow?.password ?? "";
  const demoPasswordLooksBcrypt = /^\$2[aby]\$/.test(pwd);

  const issues: string[] = [];
  if (!demoAccount || !demoUserRow) {
    issues.push("falta_cuenta_o_usuario_demo");
  } else if (demoAccount.status !== "active" || demoUserRow.status !== "active") {
    issues.push("cuenta_o_usuario_inactivo");
  }
  if (!authSecretConfigured) {
    issues.push("auth_secret_falta");
  } else if (!authSecretLongEnough) {
    issues.push("auth_secret_muy_corto");
  }
  if (demoUserRow && !demoPasswordLooksBcrypt) {
    issues.push("password_demo_no_es_bcrypt");
  }

  let hint: string;
  if (!demoAccount || !demoUserRow) {
    hint =
      "No hay cuenta demo o usuario admin en ESTA base. Misma DATABASE_URL que la app: npm run db:migrate:deploy && npm run db:seed (local) o revisar build:vercel en deploy.";
  } else if (demoAccount.status !== "active" || demoUserRow.status !== "active") {
    hint = "Cuenta o usuario demo inactivo en BD.";
  } else if (!authSecretConfigured) {
    hint =
      "Falta AUTH_SECRET en el entorno (Vercel / .env). Sin él NextAuth no firma bien el JWT: openssl rand -base64 32 y pegarlo en variables.";
  } else if (!authSecretLongEnough) {
    hint =
      "AUTH_SECRET es muy corto; generá uno de al menos 32 caracteres (openssl rand -base64 32). Si lo cambiás, todas las sesiones previas se cierran.";
  } else if (!demoPasswordLooksBcrypt) {
    hint =
      "El password del usuario demo en BD no parece un hash bcrypt; ejecutá de nuevo db:seed o reset de usuario.";
  } else {
    hint =
      "Demo listo. Si la sesión se cerró sola: suele ser redeploy o cambio de AUTH_SECRET (normal). Login: demo / admin@demo.local / demo123.";
  }

  return NextResponse.json({
    ok: true,
    database: "connected",
    demoAccount: !!demoAccount,
    demoAccountStatus: demoAccount?.status ?? null,
    demoUser,
    demoUserStatus: demoUserRow?.status ?? null,
    authSecretConfigured,
    authSecretLongEnough,
    demoPasswordLooksBcrypt: demoUserRow ? demoPasswordLooksBcrypt : null,
    issues,
    hint,
  });
}
