/**
 * Servicio: calcular score básico del lead
 * MVP: reglas simples
 * TODO Fase 2: reglas más sofisticadas, machine learning
 */
import { prisma } from "@kite-prospect/db";
import { selectPreferredSearchProfile } from "@/domains/crm-leads/search-profile-preference";
import {
  leadScoreEngagementFromConversations,
  leadScoreIntentFromProfileIntent,
  leadScoreReadinessFromCommercialStage,
} from "./lead-score-rules";
import { ACTIVATION_SCORE_WEIGHTS, combineScores } from "@/domains/activation/scoring-weights";

interface ScoreWeights {
  intent: number;
  readiness: number;
  fit: number;
  engagement: number;
}

/** Legacy pesos MVP dashboard; activación usa ACTIVATION_SCORE_WEIGHTS. */
const DEFAULT_WEIGHTS: ScoreWeights = {
  intent: 0.3,
  readiness: 0.25,
  fit: 0.25,
  engagement: 0.2,
};

export type CalculateLeadScoreOptions = {
  /** Si se informa, persiste `leadId` y usa pesos de activación. */
  leadId?: string;
  useActivationWeights?: boolean;
};

export async function calculateLeadScore(
  contactId: string,
  accountId: string,
  options?: CalculateLeadScoreOptions,
) {
  const opts = options ?? {};
  const weights: ScoreWeights =
    opts.useActivationWeights || opts.leadId
      ? { ...ACTIVATION_SCORE_WEIGHTS }
      : DEFAULT_WEIGHTS;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    include: {
      searchProfiles: {
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      conversations: {
        include: {
          messages: true,
        },
      },
      leadScores: {
        ...(opts.leadId ? { where: { leadId: opts.leadId } } : {}),
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  const profileForIntent = selectPreferredSearchProfile(contact.searchProfiles);
  const intentScore = leadScoreIntentFromProfileIntent(profileForIntent?.intent);

  const readinessScore = leadScoreReadinessFromCommercialStage(contact.commercialStage);

  const fitScore = await calculateFitScore(contactId, accountId);

  const engagementScore = leadScoreEngagementFromConversations(contact.conversations);

  const totalScore = combineScores(
    intentScore,
    readinessScore,
    fitScore,
    engagementScore,
    weights,
  );

  const latestScore = contact.leadScores[0];
  const version = latestScore ? latestScore.version + 1 : 1;

  const score = await prisma.leadScore.create({
    data: {
      contactId,
      leadId: opts.leadId ?? null,
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

