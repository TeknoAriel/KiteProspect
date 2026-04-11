import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@kite-prospect/db";
import { requireAuth } from "@/lib/server-utils";
import { BranchesPanel } from "./branches-panel";

export default async function BranchesPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rows = await prisma.branch.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { contacts: true } },
    },
  });

  const branches = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Sucursales</h1>
      <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.5 }}>
        Unidades operativas dentro de tu cuenta (F3-E4). Asigná contactos a una sucursal desde la ficha o enviá{" "}
        <code>branchSlug</code> en <code>POST /api/contacts/create</code>.
      </p>
      <BranchesPanel initialBranches={branches} />
    </div>
  );
}
