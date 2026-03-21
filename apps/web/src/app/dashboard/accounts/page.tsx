import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function AccountsPage() {
  const session = await requireAuth();

  // Solo admin puede ver todas las cuentas
  // TODO Fase 2: super-admin para multi-tenant completo
  if (session.user.role !== "admin") {
    return <div>No tienes permisos para ver esta página</div>;
  }

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          contacts: true,
          properties: true,
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
        <h1 style={{ marginTop: "1rem" }}>Cuentas</h1>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {accounts.map((account) => (
          <div
            key={account.id}
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
              <h3 style={{ margin: "0 0 0.5rem 0" }}>{account.name}</h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Slug: {account.slug} | Estado: {account.status}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                Usuarios: {account._count.users} | Contactos: {account._count.contacts} | Propiedades: {account._count.properties}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                {account.status === "active" ? "✅" : account.status === "suspended" ? "⛔" : "🟡"}
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
