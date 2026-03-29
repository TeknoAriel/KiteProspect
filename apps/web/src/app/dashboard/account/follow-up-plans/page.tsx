import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FollowUpPlansSettingsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const plans = await prisma.followUpPlan.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { sequences: true } },
    },
  });

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Planes de seguimiento</h1>
      <p style={{ color: "#666", fontSize: "0.875rem", maxWidth: "40rem" }}>
        Editá la secuencia en JSON; el job <code>/api/cron/follow-up-due</code> la interpreta igual que el seed. Las
        secuencias ya creadas para contactos siguen con el plan vigente al momento de ejecutar cada paso.
      </p>

      <ul style={{ marginTop: "1.5rem", paddingLeft: 0, listStyle: "none", display: "grid", gap: "0.75rem" }}>
        {plans.map((p) => (
          <li
            key={p.id}
            style={{
              padding: "1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>{p.name}</strong>
              <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#666" }}>
                {p.status} · {p.intensity} · secuencias: {p._count.sequences}
              </span>
            </div>
            <Link href={`/dashboard/account/follow-up-plans/${p.id}`} style={{ color: "#0070f3", fontSize: "0.9rem" }}>
              Editar
            </Link>
          </li>
        ))}
      </ul>

      {plans.length === 0 && (
        <p style={{ color: "#666", marginTop: "1rem" }}>
          No hay planes. En demo aparecen tras <code>npm run db:seed</code>. Alta de planes nuevos desde UI: Fase 2.
        </p>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.85rem" }}>
        <Link href="/dashboard/followups" style={{ color: "#0070f3" }}>
          Ver cola operativa (próximos intentos)
        </Link>
      </p>
    </div>
  );
}
