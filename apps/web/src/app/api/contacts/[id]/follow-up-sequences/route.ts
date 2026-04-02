/**
 * POST: iniciar secuencia de seguimiento para el contacto (plan del mismo tenant).
 * Solo admin / coordinador. Requiere plan con sequence no vacío y sin otra secuencia activa.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startFollowUpSequenceForContact } from "@/domains/followups/services/start-follow-up-sequence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id: contactId } = await context.params;
  const accountId = session.user.accountId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const followUpPlanId = typeof o.followUpPlanId === "string" ? o.followUpPlanId.trim() : "";
  if (!followUpPlanId) {
    return NextResponse.json({ error: "followUpPlanId requerido" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const result = await startFollowUpSequenceForContact({
    accountId,
    contactId,
    followUpPlanId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    const map: Record<typeof result.error, { status: number; message: string }> = {
      contact_not_found: { status: 404, message: "Contacto no encontrado" },
      plan_not_found: { status: 404, message: "Plan no encontrado o inactivo" },
      empty_sequence: { status: 400, message: "El plan no tiene pasos válidos en sequence" },
      active_sequence_exists: {
        status: 409,
        message: "Este contacto ya tiene un seguimiento activo. Pausalo o esperá a que termine.",
      },
    };
    const m = map[result.error];
    return NextResponse.json({ error: m.message }, { status: m.status });
  }

  return NextResponse.json({ ok: true, sequenceId: result.sequenceId });
}
