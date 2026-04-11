import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_REPORT_PERIOD_OPTIONS,
  parseOperationalReportPeriodDays,
} from "./operational-reports-period";

describe("parseOperationalReportPeriodDays", () => {
  it("acepta 7, 14 y 30", () => {
    expect(parseOperationalReportPeriodDays("7")).toBe(7);
    expect(parseOperationalReportPeriodDays("14")).toBe(14);
    expect(parseOperationalReportPeriodDays("30")).toBe(30);
  });

  it("default 7 si falta o es inválido", () => {
    expect(parseOperationalReportPeriodDays(undefined)).toBe(7);
    expect(parseOperationalReportPeriodDays("")).toBe(7);
    expect(parseOperationalReportPeriodDays("99")).toBe(7);
    expect(parseOperationalReportPeriodDays("abc")).toBe(7);
  });
});

describe("OPERATIONAL_REPORT_PERIOD_OPTIONS", () => {
  it("expone tres ventanas", () => {
    expect(OPERATIONAL_REPORT_PERIOD_OPTIONS).toEqual([7, 14, 30]);
  });
});
