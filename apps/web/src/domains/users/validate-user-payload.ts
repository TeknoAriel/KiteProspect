import type { UserRole, UserStatus } from "./user-types";

export const USER_ROLES = ["admin", "coordinator", "advisor"] as const;
export const USER_STATUSES = ["active", "inactive"] as const;

type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const email = v.trim().toLowerCase();
  if (!email.includes("@") || email.length < 5) return null;
  return email;
}

function normalizeOptionalName(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  return v.trim() || null;
}

export function parseUserCreateBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const email = normalizeEmail(o.email);
  if (!email) return { ok: false, error: "email inválido" };

  if (typeof o.password !== "string" || o.password.length < 6) {
    return { ok: false, error: "password debe tener al menos 6 caracteres" };
  }

  const role = typeof o.role === "string" ? o.role : "advisor";
  if (!USER_ROLES.includes(role as UserRole)) {
    return { ok: false, error: `role debe ser uno de: ${USER_ROLES.join(", ")}` };
  }

  const status = typeof o.status === "string" ? o.status : "active";
  if (!USER_STATUSES.includes(status as UserStatus)) {
    return {
      ok: false,
      error: `status debe ser uno de: ${USER_STATUSES.join(", ")}`,
    };
  }

  const name = normalizeOptionalName(o.name);
  if (name === undefined && o.name !== undefined) {
    return { ok: false, error: "name inválido" };
  }

  return {
    ok: true,
    data: {
      email,
      password: o.password,
      role,
      status,
      name: name ?? null,
    },
  };
}

export function parseUserPatchBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if ("email" in o) {
    const email = normalizeEmail(o.email);
    if (!email) return { ok: false, error: "email inválido" };
    data.email = email;
  }

  if ("name" in o) {
    const name = normalizeOptionalName(o.name);
    if (name === undefined) return { ok: false, error: "name inválido" };
    data.name = name;
  }

  if ("role" in o) {
    if (typeof o.role !== "string" || !USER_ROLES.includes(o.role as UserRole)) {
      return { ok: false, error: `role debe ser uno de: ${USER_ROLES.join(", ")}` };
    }
    data.role = o.role;
  }

  if ("status" in o) {
    if (
      typeof o.status !== "string" ||
      !USER_STATUSES.includes(o.status as UserStatus)
    ) {
      return {
        ok: false,
        error: `status debe ser uno de: ${USER_STATUSES.join(", ")}`,
      };
    }
    data.status = o.status;
  }

  if ("password" in o) {
    if (
      o.password !== null &&
      (typeof o.password !== "string" || o.password.length < 6)
    ) {
      return { ok: false, error: "password debe tener al menos 6 caracteres o null" };
    }
    data.password = o.password;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Ningún campo para actualizar" };
  }

  return { ok: true, data };
}
