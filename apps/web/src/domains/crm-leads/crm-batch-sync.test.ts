import { describe, expect, it } from "vitest";
import { parseCrmBatchSyncItem } from "./crm-batch-sync";

describe("parseCrmBatchSyncItem", () => {
  it("rechaza sin contactId", () => {
    const r = parseCrmBatchSyncItem({ commercialStage: "hot" });
    expect(r.ok).toBe(false);
  });

  it("acepta etapa comercial + contactId", () => {
    const r = parseCrmBatchSyncItem({ contactId: "c1", commercialStage: "hot" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.contactId).toBe("c1");
      expect(r.value.commercialStage).toBe("hot");
    }
  });

  it("rechaza commercialStage inválido", () => {
    const r = parseCrmBatchSyncItem({ contactId: "c1", commercialStage: "invalid" });
    expect(r.ok).toBe(false);
  });

  it("permite externalId null explícito", () => {
    const r = parseCrmBatchSyncItem({ contactId: "c1", externalId: null });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.setExternalId).toBe(true);
      expect(r.value.externalId).toBeNull();
    }
  });
});
