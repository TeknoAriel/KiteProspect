import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";
import { runKitepropLeadSync } from "@/domains/integrations/kiteprop-rest/run-kiteprop-lead-sync";

/**
 * POST — ejecuta sync desde KiteProp REST API (últimos N días según env).
 * Body opcional: `{ "accountSlug": "demo" }` o `{ "accountId": "..." }`
 */
export async function POST(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  let body: {
    accountSlug?: string;
    accountId?: string;
    lookbackDays?: number;
    importPath?: string;
    importPathCandidates?: string[] | string;
    httpMethod?: "GET" | "POST" | "PUT" | string;
    responseListKeys?: string[] | string;
    responseListPaths?: string[] | string;
  };
  try {
    body = (await request.json()) as {
      accountSlug?: string;
      accountId?: string;
      lookbackDays?: number;
    };
  } catch {
    body = {};
  }

  let accountId = typeof body.accountId === "string" ? body.accountId.trim() : "";
  if (!accountId && typeof body.accountSlug === "string" && body.accountSlug.trim()) {
    const acc = await prisma.account.findUnique({
      where: { slug: body.accountSlug.trim() },
      select: { id: true },
    });
    if (!acc) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    accountId = acc.id;
  }
  if (!accountId) {
    const first = await prisma.account.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    if (!first) {
      return NextResponse.json({ error: "Sin cuentas en BD" }, { status: 400 });
    }
    accountId = first.id;
  }

  const lookbackDays =
    typeof body.lookbackDays === "number" && Number.isFinite(body.lookbackDays)
      ? body.lookbackDays
      : undefined;

  const toCsv = (value: string[] | string | undefined): string | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => v.trim()).filter(Boolean).join(",");
    }
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .join(",");
  };

  const envBackup = {
    importPath: process.env.KITEPROP_API_IMPORT_PATH,
    importPathCandidates: process.env.KITEPROP_API_IMPORT_PATH_CANDIDATES,
    httpMethod: process.env.KITEPROP_API_HTTP_METHOD,
    responseListKeys: process.env.KITEPROP_API_RESPONSE_LIST_KEYS,
    responseListPaths: process.env.KITEPROP_API_RESPONSE_LIST_PATHS,
  };

  const requestOverrides = {
    importPath: body.importPath?.trim(),
    importPathCandidates: toCsv(body.importPathCandidates),
    httpMethod: body.httpMethod?.trim().toUpperCase(),
    responseListKeys: toCsv(body.responseListKeys),
    responseListPaths: toCsv(body.responseListPaths),
  };

  if (requestOverrides.importPath !== undefined) {
    process.env.KITEPROP_API_IMPORT_PATH = requestOverrides.importPath;
  }
  if (requestOverrides.importPathCandidates !== undefined) {
    process.env.KITEPROP_API_IMPORT_PATH_CANDIDATES = requestOverrides.importPathCandidates;
  }
  if (requestOverrides.httpMethod !== undefined) {
    process.env.KITEPROP_API_HTTP_METHOD = requestOverrides.httpMethod;
  }
  if (requestOverrides.responseListKeys !== undefined) {
    process.env.KITEPROP_API_RESPONSE_LIST_KEYS = requestOverrides.responseListKeys;
  }
  if (requestOverrides.responseListPaths !== undefined) {
    process.env.KITEPROP_API_RESPONSE_LIST_PATHS = requestOverrides.responseListPaths;
  }

  try {
    const result = await runKitepropLeadSync(accountId, { lookbackDays });
    return NextResponse.json({
      ok: true,
      ...result,
      appliedOverrides: requestOverrides,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    process.env.KITEPROP_API_IMPORT_PATH = envBackup.importPath;
    process.env.KITEPROP_API_IMPORT_PATH_CANDIDATES = envBackup.importPathCandidates;
    process.env.KITEPROP_API_HTTP_METHOD = envBackup.httpMethod;
    process.env.KITEPROP_API_RESPONSE_LIST_KEYS = envBackup.responseListKeys;
    process.env.KITEPROP_API_RESPONSE_LIST_PATHS = envBackup.responseListPaths;
  }
}
