/**
 * Lectura/actualización de overrides de prompt IA en `Account.config` (solo admin).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  extractAiPromptFromAccountConfig,
  mergeAiPromptIntoAccountConfig,
} from "@/domains/auth-tenancy/account-ai-prompt-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { config: true },
  });

  const ai = extractAiPromptFromAccountConfig(account?.config);
  return NextResponse.json({ ok: true, ...ai });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: {
    aiConversationPromptVersion?: string | null;
    aiConversationSystemPromptAppend?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const nextConfig = mergeAiPromptIntoAccountConfig(account.config, {
    aiConversationPromptVersion: body.aiConversationPromptVersion,
    aiConversationSystemPromptAppend: body.aiConversationSystemPromptAppend,
  });

  await prisma.account.update({
    where: { id: account.id },
    data: { config: nextConfig },
  });

  const ai = extractAiPromptFromAccountConfig(nextConfig);

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "account",
      entityId: account.id,
      action: "account_ai_prompt_config_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: {
        hasVersion: Boolean(ai.aiConversationPromptVersion),
        hasAppend: Boolean(ai.aiConversationSystemPromptAppend),
      },
    });
  } catch (e) {
    console.error("[audit] account_ai_prompt_config_updated", e);
  }
  return NextResponse.json({ ok: true, ...ai });
}
