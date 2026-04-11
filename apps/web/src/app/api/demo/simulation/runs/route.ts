import { prisma } from "@kite-prospect/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["admin", "coordinator"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !ALLOWED.has(session.user.role)) {
    return NextResponse.json(
      { error: "Solo administradores o coordinadores" },
      { status: 403 },
    );
  }

  const rows = await prisma.simulationRun.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, label: true, createdAt: true },
  });

  return NextResponse.json({ runs: rows });
}
