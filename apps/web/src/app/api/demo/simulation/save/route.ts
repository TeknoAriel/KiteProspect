import { runFollowUpLab } from "@/domains/conversations/simulation/run-follow-up-lab";
import type { SimulationPayloadV1 } from "@/domains/conversations/simulation/simulation-payload";
import type { SingleScenarioRunResult } from "@/domains/conversations/simulation/run-single-scenario";
import { prisma, Prisma } from "@kite-prospect/db";
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

  let body: {
    scenarioResults?: SingleScenarioRunResult[];
    includeFollowUpLab?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const scenarioResults = Array.isArray(body.scenarioResults)
    ? body.scenarioResults
    : [];
  if (scenarioResults.length === 0) {
    return NextResponse.json(
      { error: "scenarioResults vacío o inválido" },
      { status: 400 },
    );
  }

  let followUpLab: SimulationPayloadV1["followUpLab"];
  if (body.includeFollowUpLab === true) {
    followUpLab = await runFollowUpLab({
      accountId: session.user.accountId,
      phoneSuffix: String(Date.now() % 100000).padStart(5, "0"),
      asOf: new Date(),
    });
  }

  const payload: SimulationPayloadV1 = {
    version: 1,
    createdAtIso: new Date().toISOString(),
    scenarioResults,
    ...(followUpLab !== undefined ? { followUpLab } : {}),
  };

  const run = await prisma.simulationRun.create({
    data: {
      accountId: session.user.accountId,
      label: "Laboratorio 20 escenarios",
      payload: payload as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, id: run.id });
}
