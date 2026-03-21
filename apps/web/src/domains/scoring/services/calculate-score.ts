/**
 * Servicio: calcular score básico del lead
 * MVP: reglas simples
 * TODO Fase 2: reglas más sofisticadas, machine learning
 */
import { prisma } from "@kite-prospect/db";

interface ScoreWeights {
  intent: number;
  readiness: number;
  fit: number;
  engagement: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  intent: 0.3,
  readiness: 0.25,
  fit: 0.25,
  engagement: 0.2,
};

export async function calculateLeadScore(
  contactId: string,
  accountId: string,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    include: {
      searchProfiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      conversations: {
        include: {
          messages: true,
        },
      },
      leadScores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  // Intent Score: basado en perfil declarado
  const intentScore = calculateIntentScore(contact.searchProfiles[0]);

  // Readiness Score: basado en interacciones y urgencia
  const readinessScore = calculateReadinessScore(contact);

  // Fit Score: basado en matching con inventario (simplificado en MVP)
  const fitScore = await calculateFitScore(contactId, accountId);

  // Engagement Score: basado en respuestas y actividad
  const engagementScore = calculateEngagementScore(contact.conversations);

  // Total score (ponderado)
  const totalScore =
    intentScore * weights.intent +
    readinessScore * weights.readiness +
    fitScore * weights.fit +
    engagementScore * weights.engagement;

  // Guardar score
  const latestScore = contact.leadScores[0];
  const version = latestScore ? latestScore.version + 1 : 1;

  const score = await prisma.leadScore.create({
    data: {
      contactId,
      intentScore,
      readinessScore,
      fitScore,
      engagementScore,
      totalScore,
      version,
    },
  });

  return score;
}

function calculateIntentScore(profile: { intent?: string | null } | undefined): number {
  if (!profile?.intent) return 0;

  const intentMap: Record<string, number> = {
    compra: 80,
    renta: 60,
    inversión: 70,
  };

  return intentMap[profile.intent] || 50;
}

function calculateReadinessScore(contact: { commercialStage: string; conversationalStage: string }): number {
  const stageMap: Record<string, number> = {
    hot: 90,
    opportunity_active: 85,
    visit_scheduled: 80,
    assigned: 70,
    real_lead: 60,
    prospect: 40,
    exploratory: 20,
  };

  return stageMap[contact.commercialStage] || 10;
}

async function calculateFitScore(
  contactId: string,
  accountId: string,
): Promise<number> {
  // MVP: basado en si hay matches con propiedades
  const matches = await prisma.propertyMatch.findMany({
    where: {
      contactId,
      property: {
        accountId,
        status: "available",
      },
    },
    orderBy: { score: "desc" },
    take: 1,
  });

  if (matches.length === 0) return 0;

  // Si hay match con score > 70, fit es alto
  return matches[0].score > 70 ? 80 : matches[0].score;
}

function calculateEngagementScore(conversations: Array<{ messages: Array<{ direction: string }> }>): number {
  if (conversations.length === 0) return 0;

  let inboundCount = 0;
  let outboundCount = 0;

  conversations.forEach((conv) => {
    conv.messages.forEach((msg) => {
      if (msg.direction === "inbound") inboundCount++;
      else outboundCount++;
    });
  });

  if (inboundCount === 0) return 0;

  // Ratio de respuestas
  const responseRatio = inboundCount / (outboundCount || 1);

  // MVP: lógica simple
  if (responseRatio > 1) return 80; // Responde más de lo que enviamos
  if (responseRatio > 0.5) return 60; // Responde la mitad
  if (responseRatio > 0.25) return 40; // Responde ocasionalmente
  return 20; // Poca respuesta
}
