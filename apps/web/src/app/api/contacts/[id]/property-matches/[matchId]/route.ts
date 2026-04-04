/**
 * Feedback humano sobre un PropertyMatch (F2-E2). interested | not_interested | viewed | null.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = new Set(["admin", "coordinator", "advisor"]);
const ALLOWED = new Set(["interested", "not_interested", "viewed"]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; matchId: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  const { id: contactId, matchId } = await context.params;
  const accountId = session.user.accountId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const raw = o.feedback;

  let feedback: string | null;
  if (raw === null || raw === undefined) {
    feedback = null;
  } else if (typeof raw === "string" && (ALLOWED.has(raw) || raw === "")) {
    feedback = raw === "" ? null : raw;
  } else {
    return NextResponse.json(
      { error: "feedback debe ser interested | not_interested | viewed o null." },
      { status: 400 },
    );
  }

  const match = await prisma.propertyMatch.findFirst({
    where: {
      id: matchId,
      contactId,
      contact: { accountId },
    },
    select: { id: true, propertyId: true, feedback: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match no encontrado." }, { status: 404 });
  }

  const updated = await prisma.propertyMatch.update({
    where: { id: match.id },
    data: { feedback },
    select: { id: true, feedback: true, propertyId: true },
  });

  try {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "property_match_feedback_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: {
        propertyMatchId: match.id,
        propertyId: match.propertyId,
        previousFeedback: match.feedback ?? null,
        feedback: updated.feedback ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] property_match_feedback_updated", e);
  }

  return NextResponse.json({ ok: true, propertyMatch: updated });
}
