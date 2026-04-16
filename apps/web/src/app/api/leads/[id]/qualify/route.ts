/**
 * Override manual de cualificación (admin/coordinator).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyManualQualificationOverride } from "@/domains/activation/qualification-pipeline";
import { prisma } from "@kite-prospect/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "admin" && role !== "coordinator") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  let body: { criteriaNote?: string; contactId?: string };
  try {
    body = (await request.json()) as { criteriaNote?: string; contactId?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const criteriaNote =
    typeof body.criteriaNote === "string" ? body.criteriaNote.trim() : "";
  if (!criteriaNote) {
    return NextResponse.json({ error: "criteriaNote requerido" }, { status: 400 });
  }

  const { id: leadId } = await params;
  const contactId =
    typeof body.contactId === "string" ? body.contactId.trim() : "";

  if (!contactId) {
    return NextResponse.json({ error: "contactId requerido" }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      accountId: session.user.accountId,
      contactId,
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  try {
    await applyManualQualificationOverride({
      accountId: session.user.accountId,
      contactId,
      leadId,
      criteriaNote,
      actorUserId: session.user.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
