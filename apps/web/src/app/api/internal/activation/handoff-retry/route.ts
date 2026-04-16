import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";
import { dispatchIntegrationOutbound } from "@/jobs/dispatch";

/**
 * POST — encola de nuevo el handoff para un lead `qualified` (jobId BullMQ nuevo: `replay`).
 * Body: `{ "leadId": "..." }`
 */
export async function POST(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  let body: { leadId?: string };
  try {
    body = (await request.json()) as { leadId?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) {
    return NextResponse.json({ error: "leadId requerido" }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId },
    select: { id: true, accountId: true, contactId: true, status: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  if (lead.status !== "qualified") {
    return NextResponse.json(
      {
        error: "Solo se reintenta handoff para leads en status qualified",
        status: lead.status,
      },
      { status: 409 },
    );
  }

  await dispatchIntegrationOutbound(
    {
      accountId: lead.accountId,
      contactId: lead.contactId,
      leadId: lead.id,
    },
    { replay: true },
  );

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    accountId: lead.accountId,
    replay: true,
  });
}
