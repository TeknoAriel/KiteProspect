import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";
import {
  contactWhereForAdvisorRole,
  conversationWhereForAdvisorContact,
  getAdvisorBranchScopeId,
  isContactVisibleToAdvisorSession,
} from "./advisor-contact-scope";

function baseSession(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date().toISOString(),
    user: {
      id: "u1",
      email: "a@x.com",
      role: "advisor",
      accountId: "acc1",
      accountSlug: "demo",
      advisorBranchId: "br1",
      ...overrides,
    },
  };
}

describe("getAdvisorBranchScopeId", () => {
  it("null si no es asesor", () => {
    const s = baseSession({ role: "admin", advisorBranchId: "br1" });
    expect(getAdvisorBranchScopeId(s)).toBeNull();
  });

  it("devuelve advisorBranchId para asesor", () => {
    expect(getAdvisorBranchScopeId(baseSession())).toBe("br1");
  });

  it("null si asesor sin sucursal", () => {
    expect(getAdvisorBranchScopeId(baseSession({ advisorBranchId: null }))).toBeNull();
  });
});

describe("contactWhereForAdvisorRole", () => {
  it("solo accountId si no hay sucursal de asesor", () => {
    const s = baseSession({ advisorBranchId: null });
    expect(contactWhereForAdvisorRole("acc1", s)).toEqual({ accountId: "acc1" });
  });

  it("OR sucursal o null si asesor con sucursal", () => {
    const s = baseSession();
    expect(contactWhereForAdvisorRole("acc1", s)).toEqual({
      accountId: "acc1",
      OR: [{ branchId: "br1" }, { branchId: null }],
    });
  });
});

describe("conversationWhereForAdvisorContact", () => {
  it("anida contact OR para asesor con sucursal", () => {
    const s = baseSession();
    expect(conversationWhereForAdvisorContact("acc1", s)).toEqual({
      accountId: "acc1",
      contact: {
        OR: [{ branchId: "br1" }, { branchId: null }],
      },
    });
  });
});

describe("isContactVisibleToAdvisorSession", () => {
  const s = baseSession();

  it("true sin filtro de sucursal en sesión", () => {
    const x = baseSession({ advisorBranchId: null });
    expect(isContactVisibleToAdvisorSession(x, "other")).toBe(true);
  });

  it("true para mismo branch o null", () => {
    expect(isContactVisibleToAdvisorSession(s, null)).toBe(true);
    expect(isContactVisibleToAdvisorSession(s, "br1")).toBe(true);
  });

  it("false para otra sucursal", () => {
    expect(isContactVisibleToAdvisorSession(s, "br2")).toBe(false);
  });
});
