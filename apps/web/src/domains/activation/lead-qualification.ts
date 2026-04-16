import type { Consent } from "@prisma/client";

export type QualificationThresholds = {
  totalMin: number;
  intentMin: number;
  fitMin: number;
  readinessMin: number;
  engagementMin: number;
  lastInboundMaxDays: number;
  minInboundTurns30d: number;
};

export const DEFAULT_QUALIFICATION_THRESHOLDS: QualificationThresholds = {
  totalMin: 60,
  intentMin: 45,
  fitMin: 40,
  readinessMin: 35,
  engagementMin: 30,
  lastInboundMaxDays: 14,
  minInboundTurns30d: 2,
};

export type ScoreSnapshot = {
  totalScore: number;
  intentScore: number;
  readinessScore: number;
  fitScore: number;
  engagementScore: number;
};

export type EngagementSignals = {
  lastInboundAt: Date | null;
  inboundCount30d: number;
  emailEngagementHit: boolean;
};

export type QualificationContext = {
  commercialStage: string;
  consents: Pick<Consent, "channel" | "granted" | "revokedAt">[];
  thresholds?: QualificationThresholds;
  allowQualifyWithoutRecentInbound?: boolean;
};

export type QualificationResult =
  | {
      qualified: true;
      reasons: string[];
    }
  | {
      qualified: false;
      reasons: string[];
    };

/** Q1–Q8 y E1–E3 (reglas cerradas). */
export function evaluateAutomaticQualification(
  score: ScoreSnapshot,
  engagement: EngagementSignals,
  ctx: QualificationContext,
): QualificationResult {
  const t = ctx.thresholds ?? DEFAULT_QUALIFICATION_THRESHOLDS;
  const fail: string[] = [];

  if (ctx.commercialStage === "blocked") {
    fail.push("Q7: commercialStage blocked");
  }

  const hasOutboundConsent = ctx.consents.some(
    (c) =>
      c.granted &&
      !c.revokedAt &&
      (c.channel === "whatsapp" || c.channel === "email"),
  );
  if (!hasOutboundConsent) {
    fail.push("Q6: sin consentimiento vigente whatsapp/email");
  }

  if (score.totalScore < t.totalMin) fail.push(`Q1: total ${score.totalScore} < ${t.totalMin}`);
  if (score.intentScore < t.intentMin) fail.push(`Q2: intent ${score.intentScore} < ${t.intentMin}`);
  if (score.fitScore < t.fitMin) fail.push(`Q3: fit ${score.fitScore} < ${t.fitMin}`);
  if (score.readinessScore < t.readinessMin)
    fail.push(`Q4: readiness ${score.readinessScore} < ${t.readinessMin}`);
  if (score.engagementScore < t.engagementMin)
    fail.push(`Q5: engagement ${score.engagementScore} < ${t.engagementMin}`);

  const now = Date.now();
  const daysSinceInbound = engagement.lastInboundAt
    ? (now - engagement.lastInboundAt.getTime()) / (24 * 60 * 60 * 1000)
    : Infinity;

  const e1 = engagement.lastInboundAt != null && daysSinceInbound <= t.lastInboundMaxDays;
  const e2 = engagement.inboundCount30d >= t.minInboundTurns30d;
  const e3 = engagement.emailEngagementHit;

  const engagementOk = e1 || e2 || e3;
  if (!engagementOk && !ctx.allowQualifyWithoutRecentInbound) {
    fail.push("E1–E3: sin señal de engagement reciente suficiente");
  }

  if (fail.length === 0) {
    const reasons: string[] = ["Criterios Q1–Q8 y E1–E3 cumplidos"];
    if (e1) reasons.push("E1: inbound reciente");
    if (e2) reasons.push("E2: ≥2 turnos inbound en 30d");
    if (e3) reasons.push("E3: engagement email");
    return { qualified: true, reasons };
  }

  return { qualified: false, reasons: fail };
}
