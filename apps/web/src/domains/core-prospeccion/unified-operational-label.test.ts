import { describe, expect, it } from "vitest";
import { resolveUnifiedOperationalLabel } from "./unified-operational-label";

describe("resolveUnifiedOperationalLabel", () => {
  it("prioriza cierre y descarte comercial", () => {
    expect(resolveUnifiedOperationalLabel("new", "won")).toBe("CERRADO");
    expect(resolveUnifiedOperationalLabel("followup_active", "lost")).toBe("DESCARTADO");
  });

  it("respeta bloqueo y pausa", () => {
    expect(resolveUnifiedOperationalLabel("answered", "blocked")).toBe("BLOQUEADO");
    expect(resolveUnifiedOperationalLabel("profiled_useful", "paused")).toBe("EN PAUSA");
  });

  it("mapea etapas conversacionales típicas", () => {
    expect(resolveUnifiedOperationalLabel("new", "exploratory")).toBe("NUEVO");
    expect(resolveUnifiedOperationalLabel("answered", "exploratory")).toBe("CONTACTADO");
    expect(resolveUnifiedOperationalLabel("profiled_partial", "exploratory")).toBe("PERFIL INCOMPLETO");
  });
});
