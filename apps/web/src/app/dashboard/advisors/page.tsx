import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function AdvisorsPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  const advisors = await prisma.advisor.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Asesores</h1>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {advisors.map((advisor) => (
          <div
            key={advisor.id}
            style={{
              padding: "1.5rem",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>{advisor.name}</h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Email: {advisor.email || advisor.user?.email || "N/A"}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Teléfono: {advisor.phone || "N/A"} | Estado: {advisor.status}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Asignaciones activas: {advisor._count.assignments}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                {advisor.status === "active" ? "✅" : "⛔"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Vista de lectura. CRUD completo en Fase 2.
        </p>
      </div>
    </div>
  );
}
