/**
 * Autenticación para POST /api/contacts/create: secreto global y/o API key por tenant (F3-E2).
 */
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "@kite-prospect/db";
import { parseCaptureApiKeyPrefix } from "./capture-api-key-format";

function safeEqualStrings(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function extractCaptureToken(request: NextRequest): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice(7).trim();
  }
  const headerSecret = request.headers.get("x-capture-secret")?.trim();
  if (headerSecret) return headerSecret;
  return null;
}

export function verifyGlobalCaptureSecret(token: string): boolean {
  const secret = process.env.CAPTURE_API_SECRET?.trim();
  if (!secret) return false;
  return safeEqualStrings(token, secret);
}

export async function verifyTenantCaptureKey(token: string, accountId: string): Promise<boolean> {
  const prefix = parseCaptureApiKeyPrefix(token);
  if (!prefix) return false;
  const row = await prisma.captureApiKey.findFirst({
    where: { keyPrefix: prefix, accountId, revokedAt: null },
  });
  if (!row) return false;
  return bcrypt.compare(token, row.keyHash);
}

export async function captureAuthConfiguredForAccount(accountId: string): Promise<boolean> {
  const hasGlobal = Boolean(process.env.CAPTURE_API_SECRET?.trim());
  if (hasGlobal) return true;
  const n = await prisma.captureApiKey.count({
    where: { accountId, revokedAt: null },
  });
  return n > 0;
}
