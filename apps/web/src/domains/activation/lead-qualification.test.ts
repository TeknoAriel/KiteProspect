import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUALIFICATION_THRESHOLDS,
  evaluateAutomaticQualification,
} from "./lead-qualification";

describe("evaluateAutomaticQualification", () => {
  it("califica cuando se cumplen umbrales y engagement E1", () => {
    const r = evaluateAutomaticQualification(
      {
        totalScore: 72,
        intentScore: 80,
        fitScore: 85,
        readinessScore: 40,
        engagementScore: 80,
      },
      {
        lastInboundAt: new Date(),
        inboundCount30d: 1,
        emailEngagementHit: false,
      },
      {
        commercialStage: "prospect",
        consents: [
          { channel: "email", granted: true, revokedAt: null },
        ],
      },
    );
    expect(r.qualified).toBe(true);
  });

  it("falla sin consentimiento (Q6)", () => {
    const r = evaluateAutomaticQualification(
      {
        totalScore: 90,
        intentScore: 90,
        fitScore: 90,
        readinessScore: 90,
        engagementScore: 90,
      },
      {
        lastInboundAt: new Date(),
        inboundCount30d: 5,
        emailEngagementHit: false,
      },
      {
        commercialStage: "prospect",
        consents: [{ channel: "sms", granted: true, revokedAt: null }],
      },
    );
    expect(r.qualified).toBe(false);
    expect(r.qualified === false && r.reasons.some((x) => x.includes("Q6"))).toBe(
      true,
    );
  });

  it("usa umbral por defecto de total (Q1)", () => {
    const r = evaluateAutomaticQualification(
      {
        totalScore: DEFAULT_QUALIFICATION_THRESHOLDS.totalMin - 1,
        intentScore: 80,
        fitScore: 80,
        readinessScore: 40,
        engagementScore: 80,
      },
      {
        lastInboundAt: new Date(),
        inboundCount30d: 2,
        emailEngagementHit: false,
      },
      {
        commercialStage: "prospect",
        consents: [{ channel: "email", granted: true, revokedAt: null }],
      },
    );
    expect(r.qualified).toBe(false);
  });
});
