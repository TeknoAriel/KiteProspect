import { describe, expect, it } from "vitest";
import {
  buildOperationalReportsExportUrl,
  buildReportesDashboardUrl,
  parseOperationalReportBranchIdParam,
} from "./operational-reports-branch";

describe("parseOperationalReportBranchIdParam", () => {
  it("undefined o vacío", () => {
    expect(parseOperationalReportBranchIdParam(undefined)).toBeUndefined();
    expect(parseOperationalReportBranchIdParam("")).toBeUndefined();
    expect(parseOperationalReportBranchIdParam("  ")).toBeUndefined();
  });

  it("recorta", () => {
    expect(parseOperationalReportBranchIdParam("  abc  ")).toBe("abc");
  });

  it("primer elemento si es array", () => {
    expect(parseOperationalReportBranchIdParam(["x", "y"])).toBe("x");
  });
});

describe("buildReportesDashboardUrl", () => {
  it("días y sucursal opcional", () => {
    expect(buildReportesDashboardUrl({ days: 14 })).toBe("/dashboard/reportes?days=14");
    expect(buildReportesDashboardUrl({ days: 7, branchId: "br1" })).toBe(
      "/dashboard/reportes?days=7&branchId=br1",
    );
  });
});

describe("buildOperationalReportsExportUrl", () => {
  it("alinea query con dashboard", () => {
    expect(buildOperationalReportsExportUrl({ days: 30, branchId: "x" })).toBe(
      "/api/exports/operational-reports?days=30&branchId=x",
    );
  });
});
