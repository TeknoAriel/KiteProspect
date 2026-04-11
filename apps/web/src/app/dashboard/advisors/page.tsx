import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function AdvisorsPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

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
      branch: { select: { name: true } },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
            ← Volver
          </Link>
          <h1 style={{ marginTop: "1rem" }}>Asesores</h1>
        </div>
        {canMutate && (
          <Link
            href="/dashboard/advisors/new"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
            }}
          >
            Nuevo asesor
          </Link>
        )}
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
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>{advisor.name}</h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Email: {advisor.email || advisor.user?.email || "N/A"}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Teléfono: {advisor.phone || "N/A"} | Estado: {advisor.status}
                {advisor.branch?.name ? (
                  <>
                    {" "}
                    | Sucursal: {advisor.branch.name}
                  </>
                ) : null}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Asignaciones: {advisor._count.assignments}
                {advisor.user?.email && (
                  <>
                    {" "}
                    | Usuario: {advisor.user.email}
                  </>
                )}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                {advisor.status === "active" ? "✅" : "⛔"}
              </span>
              <Link href={`/dashboard/advisors/${advisor.id}/edit`} style={{ color: "#0070f3", fontSize: "0.875rem" }}>
                {canMutate ? "Editar" : "Ver"}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {advisors.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay asesores cargados.</p>
          {canMutate && (
            <p style={{ marginTop: "0.5rem" }}>
              <Link href="/dashboard/advisors/new" style={{ color: "#0070f3" }}>
                Crear el primero
              </Link>
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>F1-E3:</strong> ABM de asesores; vínculo opcional con un usuario del tenant (un usuario → un asesor).
        </p>
      </div>
    </div>
  );
}
