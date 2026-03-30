/**
 * Servicio: calcular score básico del lead
 * MVP: reglas simples
 * TODO Fase 2: reglas más sofisticadas, machine learning
 */
import { prisma } from "@kite-prospect/db";
import {
  leadScoreEngagementFromConversations,
  leadScoreIntentFromProfileIntent,
  leadScoreReadinessFromCommercialStage,
} from "./lead-score-rules";

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

  const intentScore = leadScoreIntentFromProfileIntent(contact.searchProfiles[0]?.intent);

  const readinessScore = leadScoreReadinessFromCommercialStage(contact.commercialStage);

  const fitScore = await calculateFitScore(contactId, accountId);

  const engagementScore = leadScoreEngagementFromConversations(contact.conversations);

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

async function calculateFitScore(
  contactId: string,
  accountId: string,
): Promise<number> {
  /** Promedio de los mejores matches (hasta 3) sobre inventario disponible; alinea fit con calidad global del match. */
  const matches = await prisma.propertyMatch.findMany({
    where: {
      contactId,
      property: {
        accountId,
        status: "available",
      },
    },
    orderBy: { score: "desc" },
    take: 3,
  });

  if (matches.length === 0) return 0;

  const sum = matches.reduce((acc, m) => acc + m.score, 0);
  const avg = sum / matches.length;
  return Math.min(100, Math.round(avg));
}

