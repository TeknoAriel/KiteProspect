import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  // Stats básicos para dashboard
  const [contactsCount, conversationsCount, propertiesCount] = await Promise.all([
    prisma.contact.count({ where: { accountId } }),
    prisma.conversation.count({ where: { accountId } }),
    prisma.property.count({ where: { accountId } }),
  ]);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: "#666" }}>Cuenta: {session.user.accountSlug}</p>
        </div>
        <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/dashboard/inbox" style={{ textDecoration: "none", color: "#0070f3" }}>
            Inbox
          </Link>
          <Link href="/dashboard/contacts" style={{ textDecoration: "none", color: "#0070f3" }}>
            Contactos
          </Link>
          <Link href="/dashboard/followups" style={{ textDecoration: "none", color: "#0070f3" }}>
            Seguimiento
          </Link>
          {session.user.role === "admin" && (
            <>
              <Link href="/dashboard/audit" style={{ textDecoration: "none", color: "#0070f3" }}>
                Auditoría
              </Link>
              <Link
                href="/dashboard/account/ai-prompt"
                style={{ textDecoration: "none", color: "#0070f3" }}
              >
                IA (cuenta)
              </Link>
            </>
          )}
          <Link href="/dashboard/accounts" style={{ textDecoration: "none", color: "#0070f3" }}>
            Cuentas
          </Link>
          <Link href="/dashboard/users" style={{ textDecoration: "none", color: "#0070f3" }}>
            Usuarios
          </Link>
          <Link href="/dashboard/advisors" style={{ textDecoration: "none", color: "#0070f3" }}>
            Asesores
          </Link>
        </nav>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Contactos</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{contactsCount}</p>
        </div>
        <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Conversaciones</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{conversationsCount}</p>
        </div>
        <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Propiedades</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{propertiesCount}</p>
        </div>
      </div>

      <div style={{ padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP Fase 1:</strong> Dashboard básico. Ver roadmap para features completas.
        </p>
      </div>
    </div>
  );
}
