/**
 * Reglas puras de sub-scores de lead (sin Prisma). Usadas por `calculateLeadScore` y tests.
 */

export function normIntentKeyForLeadScore(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
}

/** Intent score 0–100 desde texto de SearchProfile.intent */
export function leadScoreIntentFromProfileIntent(intent: string | null | undefined): number {
  if (!intent) return 0;
  const key = normIntentKeyForLeadScore(intent);
  const intentMap: Record<string, number> = {
    compra: 80,
    renta: 60,
    inversion: 70,
  };
  return intentMap[key] ?? 50;
}

/** Readiness 0–100 desde etapa comercial */
export function leadScoreReadinessFromCommercialStage(commercialStage: string): number {
  const stageMap: Record<string, number> = {
    won: 95,
    hot: 90,
    opportunity_active: 85,
    visit_scheduled: 80,
    assigned: 70,
    real_lead: 60,
    prospect: 40,
    exploratory: 20,
    paused: 25,
    blocked: 15,
    lost: 10,
  };
  return stageMap[commercialStage] ?? 10;
}

type ConvMsg = { direction: string };

/** Engagement 0–100 desde conversaciones con mensajes cargados */
export function leadScoreEngagementFromConversations(
  conversations: Array<{ messages: ConvMsg[] }>,
): number {
  if (conversations.length === 0) return 0;

  let inboundCount = 0;
  let outboundCount = 0;
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.direction === "inbound") inboundCount++;
      else outboundCount++;
    }
  }

  if (inboundCount === 0) return 0;

  const responseRatio = inboundCount / (outboundCount || 1);
  if (responseRatio > 1) return 80;
  if (responseRatio > 0.5) return 60;
  if (responseRatio > 0.25) return 40;
  return 20;
}
