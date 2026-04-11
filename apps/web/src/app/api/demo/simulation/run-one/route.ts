import { getScenarioByKey } from "@/domains/conversations/simulation/conversation-scenarios";
import { runSingleConversationScenario } from "@/domains/conversations/simulation/run-single-scenario";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

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

  let body: { scenarioKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const scenarioKey =
    typeof body.scenarioKey === "string" ? body.scenarioKey.trim() : "";
  if (!scenarioKey) {
    return NextResponse.json({ error: "Falta scenarioKey" }, { status: 400 });
  }

  const scenario = getScenarioByKey(scenarioKey);
  if (!scenario) {
    return NextResponse.json({ error: "Escenario no encontrado" }, { status: 404 });
  }

  const phoneSuffix = String(Date.now() % 100000).padStart(5, "0");

  const result = await runSingleConversationScenario({
    accountId: session.user.accountId,
    actorUserId: session.user.id,
    scenario,
    phoneSuffix,
  });

  return NextResponse.json({ ok: true, result });
}
