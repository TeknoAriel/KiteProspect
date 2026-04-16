import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — último intento de handoff para un lead: payload enviado (snapshot) y respuesta recibida.
 * Query: `leadId` (requerido).
 */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const leadId = new URL(request.url).searchParams.get("leadId")?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "Query leadId requerido" }, { status: 400 });
  }

  const row = await prisma.handoffOutboundAttempt.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      accountId: true,
      leadId: true,
      contactId: true,
      dedupeKey: true,
      eventId: true,
      attemptNumber: true,
      targetUrl: true,
      httpStatus: true,
      ok: true,
      latencyMs: true,
      requestBodySha256: true,
      requestPayloadSnapshot: true,
      responseSnippet: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Sin intentos de handoff para este lead" }, { status: 404 });
  }

  return NextResponse.json({ attempt: row });
}
