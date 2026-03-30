import { describe, expect, it } from "vitest";
import {
  leadScoreEngagementFromConversations,
  leadScoreIntentFromProfileIntent,
  leadScoreReadinessFromCommercialStage,
  normIntentKeyForLeadScore,
} from "./lead-score-rules";

describe("normIntentKeyForLeadScore", () => {
  it("quita acentos y unifica ñ→n para inversión", () => {
    expect(normIntentKeyForLeadScore(" Inversión ")).toBe("inversion");
    expect(normIntentKeyForLeadScore("COMPRA")).toBe("compra");
  });
});

describe("leadScoreIntentFromProfileIntent", () => {
  it("mapea intenciones conocidas y sin tilde en inversión", () => {
    expect(leadScoreIntentFromProfileIntent("compra")).toBe(80);
    expect(leadScoreIntentFromProfileIntent("renta")).toBe(60);
    expect(leadScoreIntentFromProfileIntent("inversión")).toBe(70);
    expect(leadScoreIntentFromProfileIntent("inversion")).toBe(70);
  });

  it("devuelve 50 por defecto si no coincide mapa", () => {
    expect(leadScoreIntentFromProfileIntent("otro")).toBe(50);
  });

  it("devuelve 0 si vacío", () => {
    expect(leadScoreIntentFromProfileIntent(null)).toBe(0);
    expect(leadScoreIntentFromProfileIntent("")).toBe(0);
  });
});

describe("leadScoreReadinessFromCommercialStage", () => {
  it("cubre etapas comerciales clave", () => {
    expect(leadScoreReadinessFromCommercialStage("won")).toBe(95);
    expect(leadScoreReadinessFromCommercialStage("hot")).toBe(90);
    expect(leadScoreReadinessFromCommercialStage("lost")).toBe(10);
    expect(leadScoreReadinessFromCommercialStage("desconocida")).toBe(10);
  });
});

describe("leadScoreEngagementFromConversations", () => {
  it("devuelve 0 sin conversaciones o sin inbound", () => {
    expect(leadScoreEngagementFromConversations([])).toBe(0);
    expect(leadScoreEngagementFromConversations([{ messages: [{ direction: "outbound" }] }])).toBe(0);
  });

  it("sube el score cuando hay más inbound que outbound", () => {
    expect(
      leadScoreEngagementFromConversations([
        {
          messages: [
            { direction: "inbound" },
            { direction: "inbound" },
            { direction: "outbound" },
          ],
        },
      ]),
    ).toBe(80);
  });
});
