import { CONVERSATION_SCENARIOS } from "@/domains/conversations/simulation/conversation-scenarios";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const scenarios = CONVERSATION_SCENARIOS.map((s) => ({
    key: s.key,
    title: s.title,
    intent: s.intent,
    channel: s.channel,
    turnCount: s.turns.length,
  }));
  return NextResponse.json({ scenarios });
}
