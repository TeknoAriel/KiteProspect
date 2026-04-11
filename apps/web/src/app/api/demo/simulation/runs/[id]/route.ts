import { buildMarkdownReport } from "@/domains/conversations/simulation/simulation-payload";
import type { SimulationPayloadV1 } from "@/domains/conversations/simulation/simulation-payload";
import { prisma } from "@kite-prospect/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["admin", "coordinator"]);

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const row = await prisma.simulationRun.findFirst({
    where: { id, accountId: session.user.accountId },
  });

  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const payload = row.payload as unknown as SimulationPayloadV1;
  const markdown = buildMarkdownReport(payload);

  return NextResponse.json({
    id: row.id,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    payload,
    markdown,
  });
}
