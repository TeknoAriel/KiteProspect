import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function ContactsPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  const contacts = await prisma.contact.findMany({
    where: { accountId },
    orderBy: { updatedAt: "desc" },
    take: 50, // MVP: limitar a 50
    include: {
      _count: {
        select: {
          conversations: true,
          tasks: true,
          notes: true,
          assignments: true,
        },
      },
      assignments: {
        where: { status: "active" },
        include: {
          advisor: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Contactos</h1>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/dashboard/contacts/${contact.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                padding: "1.5rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>{contact.name || contact.email || contact.phone || "Sin nombre"}</h3>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                  {contact.email && <span>📧 {contact.email}</span>}
                  {contact.phone && <span>📱 {contact.phone}</span>}
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666" }}>
                  <span>Conversación: {contact.conversationalStage}</span>
                  <span>Comercial: {contact.commercialStage}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
                  <span>💬 {contact._count.conversations}</span>
                  <span>✓ {contact._count.tasks}</span>
                  <span>📝 {contact._count.notes}</span>
                  {contact.assignments[0] && (
                    <span>👤 {contact.assignments[0].advisor.name}</span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.875rem", color: "#666" }}>
                  {contact.commercialStage === "hot" ? "🔥" : contact.commercialStage === "won" ? "✅" : "⚪"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {contacts.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay contactos aún.</p>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Vista de lista. Filtros y búsqueda en Fase 2.
        </p>
      </div>
    </div>
  );
}
