import { describe, expect, it } from "vitest";
import {
  assertOfficialMatrixLengths,
  getOfficialMatrixRow,
  OFFICIAL_MATRIX_BY_INTENSITY,
} from "./follow-up-official-matrix";
import { INTENSITY_DEFAULT_MAX_ATTEMPTS } from "./follow-up-intensity";

describe("follow-up-official-matrix", () => {
  it("cada intensidad tiene tantos pasos como el default de intentos", () => {
    assertOfficialMatrixLengths();
    for (const k of Object.keys(OFFICIAL_MATRIX_BY_INTENSITY) as Array<
      keyof typeof OFFICIAL_MATRIX_BY_INTENSITY
    >) {
      expect(OFFICIAL_MATRIX_BY_INTENSITY[k].length).toBe(INTENSITY_DEFAULT_MAX_ATTEMPTS[k]);
    }
  });

  it("devuelve fila por índice o null", () => {
    expect(getOfficialMatrixRow("soft", 0)?.coreStageKey).toBe("activation");
    expect(getOfficialMatrixRow("soft", 99)).toBeNull();
  });
});
