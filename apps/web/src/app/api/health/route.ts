/**
 * Diagnóstico público (sin secretos): comprueba conexión a BD y existencia del demo.
 * Útil cuando el login falla: si demoUser es false, falta seed en esta base.
 */
import { NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, must-revalidate",
  Pragma: "no-cache",
};

export async function GET() {
  const onVercel = process.env.VERCEL === "1";
  const nodeEnv = process.env.NODE_ENV ?? "development";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("[health] db", e);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        hint: "Revisa DATABASE_URL en Vercel y que Neon esté activo.",
        runtime: { nodeEnv, vercel: onVercel },
        security: { hsts: onVercel },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
  const authSecretConfigured = authSecret.length > 0;
  /** NextAuth recomienda secreto fuerte; si falta o es corto, las sesiones JWT fallan o se invalidan al redeploy. */
  const authSecretLongEnough = authSecret.length >= 32;

  const authUrl = process.env.AUTH_URL?.trim() ?? "";
  const authUrlConfigured = authUrl.length > 0;
  const isDeployed =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  /** Solo presencia de variables (sin valores); útil en producción para ver qué falta configurar. */
  const captureSecretConfigured =
    (process.env.CAPTURE_API_SECRET?.trim() ?? "").length > 0;
  const cronSecretConfigured = (process.env.CRON_SECRET?.trim() ?? "").length > 0;
  const resendConfigured =
    (process.env.RESEND_API_KEY?.trim() ?? "").length > 0 &&
    (process.env.FOLLOW_UP_FROM_EMAIL?.trim() ?? "").length > 0;
  const whatsAppWebhookConfigured =
    (process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "").length > 0 &&
    (process.env.WHATSAPP_ACCOUNT_SLUG?.trim() ?? "").length > 0;
  const whatsAppOutboundConfigured =
    (process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "").length > 0 &&
    (process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "").length > 0;
  /** Si está definido, el POST del webhook exige `X-Hub-Signature-256` válida; si no coincide con el App Secret de Meta → 401. */
  const whatsAppAppSecretConfigured =
    (process.env.WHATSAPP_APP_SECRET?.trim() ?? "").length > 0;
  const followUpSmsTwilioConfigured =
    (process.env.TWILIO_ACCOUNT_SID?.trim() ?? "").length > 0 &&
    (process.env.TWILIO_AUTH_TOKEN?.trim() ?? "").length > 0 &&
    (process.env.TWILIO_FROM_NUMBER?.trim() ?? "").length > 0;
  const followUpSmsTelnyxConfigured =
    (process.env.TELNYX_API_KEY?.trim() ?? "").length > 0 &&
    (process.env.TELNYX_FROM_NUMBER?.trim() ?? "").length > 0;
  const smsProviderExpected = (process.env.SMS_PROVIDER ?? "twilio").trim().toLowerCase();
  const followUpSmsProvider = smsProviderExpected === "telnyx" ? "telnyx" : "twilio";
  const followUpSmsConfigured =
    followUpSmsProvider === "telnyx" ? followUpSmsTelnyxConfigured : followUpSmsTwilioConfigured;
  const aiProvider = (
    process.env.AI_PROVIDER?.trim().toLowerCase() || "gemini"
  ) as "gemini" | "openai";
  const aiConfigured =
    aiProvider === "openai"
      ? (process.env.OPENAI_API_KEY?.trim() ?? "").length > 0
      : (process.env.GEMINI_API_KEY?.trim() ?? "").length > 0;

  const deployCommit = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;
  const vercelEnv = process.env.VERCEL_ENV?.trim() || null;
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID?.trim() || null;

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

  const demoAdvisorUserRow = demoAccount
    ? await prisma.user.findFirst({
        where: {
          accountId: demoAccount.id,
          email: { equals: "advisor@demo.local", mode: "insensitive" },
        },
        select: { id: true, status: true, role: true },
      })
    : null;
  const demoAdvisorUser = !!demoAdvisorUserRow && demoAdvisorUserRow.role === "advisor";

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
  if (isDeployed && !authUrlConfigured) {
    issues.push("auth_url_falta_produccion");
  }
  if (demoUserRow && !demoPasswordLooksBcrypt) {
    issues.push("password_demo_no_es_bcrypt");
  }
  if (demoAccount && demoUser && !demoAdvisorUser) {
    issues.push("falta_usuario_asesor_demo");
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
  } else if (isDeployed && !authUrlConfigured) {
    hint =
      "Falta AUTH_URL con la URL pública exacta de la app (sin barra final). En Vercel suele ser https://TU-PROYECTO.vercel.app — sin esto el login puede fallar en producción.";
  } else if (issues.includes("falta_usuario_asesor_demo")) {
    hint =
      "Cuenta demo sin usuario asesor (advisor@demo.local). Volvé a correr seed: npm run db:seed (local) o redeploy con seed en Vercel.";
  } else {
    hint =
      "Demo listo. Si la sesión se cerró sola: suele ser redeploy o cambio de AUTH_SECRET (normal). Login admin: demo / admin@demo.local / demo123. Asesor demo (L21): advisor@demo.local / demo123.";
  }

  return NextResponse.json(
    {
      ok: true,
      database: "connected",
      runtime: { nodeEnv, vercel: onVercel },
      security: {
        hsts: onVercel,
        poweredByHeaderDisabled: true,
      },
      demoAccount: !!demoAccount,
      demoAccountStatus: demoAccount?.status ?? null,
      demoUser,
      demoAdvisorUser,
      demoAdvisorUserStatus: demoAdvisorUserRow?.status ?? null,
      demoUserStatus: demoUserRow?.status ?? null,
      authSecretConfigured,
      authSecretLongEnough,
      authUrlConfigured,
      demoPasswordLooksBcrypt: demoUserRow ? demoPasswordLooksBcrypt : null,
      integrations: {
        captureApi: captureSecretConfigured,
        cron: cronSecretConfigured,
        followUpEmailResend: resendConfigured,
        followUpSmsTwilio: followUpSmsTwilioConfigured,
        followUpSmsTelnyx: followUpSmsTelnyxConfigured,
        followUpSmsProvider,
        followUpSmsConfigured,
        whatsAppWebhook: whatsAppWebhookConfigured,
        whatsAppAppSecret: whatsAppAppSecretConfigured,
        whatsAppOutbound: whatsAppOutboundConfigured,
        aiConversational: aiConfigured,
        aiProviderExpected: aiProvider,
      },
      deploy: {
        ...(deployCommit ? { commit: deployCommit } : {}),
        ...(vercelEnv ? { vercelEnv } : {}),
        ...(vercelDeploymentId ? { deploymentId: vercelDeploymentId } : {}),
      },
      issues,
      hint,
    },
    { headers: noStoreHeaders },
  );
}
