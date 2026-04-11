import { prisma } from "@kite-prospect/db";
import { planNextConversationAction } from "@/domains/ai-orchestration/plan-next-conversation-action";
import type { ConversationScenario } from "./conversation-scenarios";

export type AiTurnResult =
  | {
      ok: true;
      kind: string;
      draftReply?: string;
      reason?: string;
      summaryForHuman?: string;
      model: string;
      promptVersion: string;
      modelSuggestedKind: string;
      appliedRuleIds: string[];
    }
  | { ok: false; error: string };

export type ScenarioTurnReport = {
  label: string;
  inbound: string;
  ai: AiTurnResult;
};

export type SingleScenarioRunResult = {
  scenarioKey: string;
  title: string;
  channel: string;
  intent: string;
  contactId: string;
  conversationId: string;
  turns: ScenarioTurnReport[];
};

/**
 * Crea contacto + conversación únicos y ejecuta cada turno con IA real (si hay API keys).
 */
export async function runSingleConversationScenario(params: {
  accountId: string;
  actorUserId: string;
  scenario: ConversationScenario;
  /** Sufijo único por ejecución, ej. "00001" */
  phoneSuffix: string;
}): Promise<SingleScenarioRunResult> {
  const phone = `+1555999${params.phoneSuffix}`;
  const email = `sim.${params.scenario.key}.${params.phoneSuffix}@kite.lab`;

  const contact = await prisma.contact.create({
    data: {
      accountId: params.accountId,
      name: `Lab · ${params.scenario.title}`.slice(0, 120),
      phone,
      email,
      conversationalStage: "new",
      commercialStage: "exploratory",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      accountId: params.accountId,
      contactId: contact.id,
      channel: params.scenario.channel,
      channelId: `lab_${params.scenario.key}_${params.phoneSuffix}`,
      status: "active",
    },
  });

  const turns: ScenarioTurnReport[] = [];

  for (const t of params.scenario.turns) {
    const inbound = t.inbound.trim();
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        content: inbound,
        channel: params.scenario.channel,
      },
    });

    const c = await prisma.contact.findUnique({
      where: { id: contact.id },
      select: { conversationalStage: true },
    });
    if (c?.conversationalStage === "new") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { conversationalStage: "answered" },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    const aiResult = await planNextConversationAction({
      conversationId: conversation.id,
      accountId: params.accountId,
      actorUserId: params.actorUserId,
    });

    let ai: AiTurnResult;
    if (!aiResult.ok) {
      ai = { ok: false, error: aiResult.error };
    } else {
      const a = aiResult.action;
      const base = {
        ok: true as const,
        kind: a.kind,
        model: aiResult.model,
        promptVersion: aiResult.promptVersion,
        modelSuggestedKind: aiResult.modelSuggestedKind,
        appliedRuleIds: aiResult.appliedRuleIds,
      };
      if (a.kind === "reply") {
        ai = { ...base, draftReply: a.draftReply };
      } else if (a.kind === "handoff") {
        ai = {
          ...base,
          reason: a.reason,
          summaryForHuman: a.summaryForHuman,
        };
      } else {
        ai = { ...base, reason: a.reason };
      }
    }

    turns.push({
      label: t.label,
      inbound,
      ai,
    });
  }

  return {
    scenarioKey: params.scenario.key,
    title: params.scenario.title,
    channel: params.scenario.channel,
    intent: params.scenario.intent,
    contactId: contact.id,
    conversationId: conversation.id,
    turns,
  };
}
