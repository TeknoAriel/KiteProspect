import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";
import { contactWhereOperational, getOperationalContactWhere } from "./operational-reports-scope";

describe("contactWhereOperational", () => {
  it("sin sucursal: solo accountId", () => {
    expect(contactWhereOperational("acc1", undefined)).toEqual({ accountId: "acc1" });
  });

  it("con sucursal: accountId + branchId", () => {
    expect(contactWhereOperational("acc1", "br1")).toEqual({ accountId: "acc1", branchId: "br1" });
  });
});

function sessionAdvisor(branchId: string | null): Session {
  return {
    expires: new Date().toISOString(),
    user: {
      id: "u1",
      email: "a@x.com",
      role: "advisor",
      accountId: "acc1",
      accountSlug: "demo",
      advisorBranchId: branchId,
    },
  };
}

describe("getOperationalContactWhere", () => {
  it("combina filtro de reporte con alcance asesor", () => {
    const w = getOperationalContactWhere("acc1", undefined, sessionAdvisor("br1"));
    expect(w).toEqual({
      AND: [
        { accountId: "acc1" },
        {
          accountId: "acc1",
          OR: [{ branchId: "br1" }, { branchId: null }],
        },
      ],
    });
  });

  it("con sucursal en UI intersecta con alcance", () => {
    const w = getOperationalContactWhere("acc1", "br1", sessionAdvisor("br1"));
    expect(w).toEqual({
      AND: [
        { accountId: "acc1", branchId: "br1" },
        {
          accountId: "acc1",
          OR: [{ branchId: "br1" }, { branchId: null }],
        },
      ],
    });
  });
});
