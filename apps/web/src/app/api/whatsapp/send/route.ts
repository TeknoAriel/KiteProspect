/**
 * Envío manual de texto por WhatsApp (admin). Producción: requiere tokens Meta en env.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendWhatsAppTextToContact } from "@/domains/integrations/whatsapp/send-whatsapp-text";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: { contactId?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const contactId = typeof body.contactId === "string" ? body.contactId.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!contactId || !text.trim()) {
    return NextResponse.json({ error: "Se requieren contactId y text" }, { status: 400 });
  }

  const result = await sendWhatsAppTextToContact({
    contactId,
    accountId: session.user.accountId,
    text,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    const optOut = result.error.includes("optó por no");
    return NextResponse.json(
      { error: result.error, messageId: result.messageId },
      { status: optOut ? 403 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    waMessageId: result.waMessageId,
  });
}
