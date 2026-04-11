import type { AdvisorStatus } from "./advisor-types";

export const ADVISOR_STATUSES = ["active", "inactive"] as const;

type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

function normalizeOptionalEmail(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const e = v.trim().toLowerCase();
  if (!e) return null;
  if (!e.includes("@")) return undefined;
  return e;
}

function normalizeOptionalPhone(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  return v.trim() || null;
}

export function parseAdvisorCreateBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return { ok: false, error: "name es obligatorio" };

  const email = normalizeOptionalEmail(o.email);
  if (email === undefined && o.email !== undefined) {
    return { ok: false, error: "email inválido" };
  }

  const phone = normalizeOptionalPhone(o.phone);
  if (phone === undefined && o.phone !== undefined) {
    return { ok: false, error: "phone inválido" };
  }

  const status = typeof o.status === "string" ? o.status : "active";
  if (!ADVISOR_STATUSES.includes(status as AdvisorStatus)) {
    return {
      ok: false,
      error: `status debe ser uno de: ${ADVISOR_STATUSES.join(", ")}`,
    };
  }

  let userId: string | null | undefined;
  if (o.userId !== undefined) {
    if (o.userId === null || o.userId === "") {
      userId = null;
    } else if (typeof o.userId === "string" && o.userId.trim()) {
      userId = o.userId.trim();
    } else {
      return { ok: false, error: "userId inválido" };
    }
  }

  const data: Record<string, unknown> = {
    name,
    email: email ?? null,
    phone: phone ?? null,
    status,
  };
  if (userId !== undefined) data.userId = userId;

  if (o.branchId !== undefined) {
    if (o.branchId === null || o.branchId === "") {
      data.branchId = null;
    } else if (typeof o.branchId === "string" && o.branchId.trim()) {
      data.branchId = o.branchId.trim();
    } else {
      return { ok: false, error: "branchId inválido" };
    }
  }

  return { ok: true, data };
}

export function parseAdvisorPatchBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if ("name" in o) {
    if (typeof o.name !== "string" || !o.name.trim()) {
      return { ok: false, error: "name no puede estar vacío" };
    }
    data.name = o.name.trim();
  }

  if ("email" in o) {
    const email = normalizeOptionalEmail(o.email);
    if (email === undefined) return { ok: false, error: "email inválido" };
    data.email = email;
  }

  if ("phone" in o) {
    const phone = normalizeOptionalPhone(o.phone);
    if (phone === undefined) return { ok: false, error: "phone inválido" };
    data.phone = phone;
  }

  if ("status" in o) {
    if (typeof o.status !== "string" || !ADVISOR_STATUSES.includes(o.status as AdvisorStatus)) {
      return {
        ok: false,
        error: `status debe ser uno de: ${ADVISOR_STATUSES.join(", ")}`,
      };
    }
    data.status = o.status;
  }

  if ("userId" in o) {
    if (o.userId === null || o.userId === "") {
      data.userId = null;
    } else if (typeof o.userId === "string" && o.userId.trim()) {
      data.userId = o.userId.trim();
    } else {
      return { ok: false, error: "userId inválido" };
    }
  }

  if ("branchId" in o) {
    if (o.branchId === null || o.branchId === "") {
      data.branchId = null;
    } else if (typeof o.branchId === "string" && o.branchId.trim()) {
      data.branchId = o.branchId.trim();
    } else {
      return { ok: false, error: "branchId inválido" };
    }
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Ningún campo para actualizar" };
  }

  return { ok: true, data };
}
