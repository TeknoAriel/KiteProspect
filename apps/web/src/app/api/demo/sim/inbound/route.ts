import { appendDemoInboundMessage, isDemoChannel } from "@/domains/conversations/services/demo-channel-simulation";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["admin", "coordinator"]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !ALLOWED.has(session.user.role)) {
    return NextResponse.json(
      { error: "Solo administradores o coordinadores" },
      { status: 403 },
    );
  }

  let body: { channel?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";

  if (!channel || !isDemoChannel(channel)) {
    return NextResponse.json({ error: "Canal no válido" }, { status: 400 });
  }

  const result = await appendDemoInboundMessage({
    accountId: session.user.accountId,
    channel,
    actorUserId: session.user.id,
    text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    conversationId: result.conversationId,
    contactId: result.contactId,
  });
}
