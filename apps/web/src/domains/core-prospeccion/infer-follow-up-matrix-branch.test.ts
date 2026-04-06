import { describe, expect, it } from "vitest";
import { inferFollowUpMatrixBranch } from "./infer-follow-up-matrix-branch";

describe("inferFollowUpMatrixBranch", () => {
  it("prioriza bloqueo comercial", () => {
    expect(
      inferFollowUpMatrixBranch({
        commercialStage: "blocked",
        conversationalStage: "identified",
        topMatchScore: 90,
        matchCount: 3,
        hasProfileBasics: true,
      }),
    ).toBe("blocked_lead");
  });

  it("match alto por score", () => {
    expect(
      inferFollowUpMatrixBranch({
        commercialStage: "prospect",
        conversationalStage: "identified",
        topMatchScore: 80,
        matchCount: 2,
        hasProfileBasics: true,
      }),
    ).toBe("high_match");
  });

  it("sin matches pero perfil con datos", () => {
    expect(
      inferFollowUpMatrixBranch({
        commercialStage: "exploratory",
        conversationalStage: "profiled_partial",
        topMatchScore: null,
        matchCount: 0,
        hasProfileBasics: true,
      }),
    ).toBe("no_match_now");
  });

  it("no responde: último mensaje outbound antiguo", () => {
    const t0 = Date.now();
    const lastOut = t0 - 50 * 60 * 60 * 1000;
    expect(
      inferFollowUpMatrixBranch({
        commercialStage: "prospect",
        conversationalStage: "identified",
        topMatchScore: 40,
        matchCount: 1,
        hasProfileBasics: true,
        lastMessageDirection: "outbound",
        lastMessageAtMs: lastOut,
        nowMs: t0,
        noResponseAfterOutboundHours: 48,
      }),
    ).toBe("no_response");
  });

  it("no marca no_response si el outbound es reciente", () => {
    const t0 = Date.now();
    expect(
      inferFollowUpMatrixBranch({
        commercialStage: "prospect",
        conversationalStage: "identified",
        topMatchScore: 40,
        matchCount: 1,
        hasProfileBasics: true,
        lastMessageDirection: "outbound",
        lastMessageAtMs: t0 - 2 * 60 * 60 * 1000,
        nowMs: t0,
        noResponseAfterOutboundHours: 48,
      }),
    ).not.toBe("no_response");
  });
});
