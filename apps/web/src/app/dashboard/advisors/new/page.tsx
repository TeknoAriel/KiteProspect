import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { AdvisorForm } from "../advisor-form";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function NewAdvisorPage() {
  const session = await requireAuth();
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  const tenantUsers = await prisma.user.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true },
    take: 200,
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/advisors" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Asesores
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Nuevo asesor</h1>
      <AdvisorForm canMutate={canMutate} mode="create" tenantUsers={tenantUsers} />
    </div>
  );
}
