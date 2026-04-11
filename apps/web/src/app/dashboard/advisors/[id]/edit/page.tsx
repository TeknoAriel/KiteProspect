import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serializeAdvisor } from "@/domains/advisors/advisor-serialization";
import { AdvisorDeleteButton } from "../../advisor-delete-button";
import { AdvisorForm } from "../../advisor-form";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function EditAdvisorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  const [row, tenantUsers, branches] = await Promise.all([
    prisma.advisor.findFirst({
      where: { id, accountId: session.user.accountId },
      include: {
        user: { select: { email: true, name: true } },
        branch: { select: { id: true, name: true, slug: true } },
        _count: { select: { assignments: true } },
      },
    }),
    prisma.user.findMany({
      where: { accountId: session.user.accountId },
      orderBy: { email: "asc" },
      select: { id: true, email: true, name: true },
      take: 200,
    }),
    prisma.branch.findMany({
      where: { accountId: session.user.accountId, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 200,
    }),
  ]);

  if (!row) notFound();

  const initial = serializeAdvisor(row);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/advisors" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Asesores
      </Link>
      <h1 style={{ marginTop: "1rem" }}>{canMutate ? "Editar asesor" : "Detalle de asesor"}</h1>
      <AdvisorForm canMutate={canMutate} mode="edit" initial={initial} tenantUsers={tenantUsers} branches={branches} />
      {canMutate && <AdvisorDeleteButton advisorId={initial.id} />}
    </div>
  );
}
