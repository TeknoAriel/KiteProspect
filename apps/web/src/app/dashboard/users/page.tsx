import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function UsersPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  // Solo admin y coordinator pueden gestionar usuarios
  if (!["admin", "coordinator"].includes(session.user.role)) {
    return <div>No tienes permisos para ver esta página</div>;
  }

  const users = await prisma.user.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          advisors: true,
        },
      },
    },
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
            ← Volver
          </Link>
          <h1 style={{ marginTop: "1rem" }}>Usuarios</h1>
        </div>
        <Link
          href="/dashboard/users/new"
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
          Nuevo usuario
        </Link>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {users.map((user) => (
          <div
            key={user.id}
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
              <h3 style={{ margin: "0 0 0.5rem 0" }}>{user.name || user.email}</h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Email: {user.email}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Rol: {user.role} | Estado: {user.status} | Asesores: {user._count.advisors}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                {user.status === "active" ? "✅" : "⛔"}
              </span>
              <Link href={`/dashboard/users/${user.id}/edit`} style={{ color: "#0070f3", fontSize: "0.875rem" }}>
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP F1-E3:</strong> Alta, edición y baja lógica de usuario dentro del tenant.
        </p>
      </div>
    </div>
  );
}
