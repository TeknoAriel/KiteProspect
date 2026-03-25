import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function InboxPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  // Todas las conversaciones activas, ordenadas por última actividad
  const conversations = await prisma.conversation.findMany({
    where: {
      accountId,
      status: "active",
    },
    orderBy: { updatedAt: "desc" },
    take: 50, // MVP: limitar a 50
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          conversationalStage: true,
          commercialStage: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Último mensaje
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Inbox</h1>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          {conversations.length} conversaciones activas. Clic en la tarjeta para abrir el hilo y la
          asistencia IA.
        </p>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {conversations.map((conv) => {
          const lastMessage = conv.messages[0];
          const contact = conv.contact;

          return (
            <div
              key={conv.id}
              style={{
                padding: "1.5rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <Link
                href={`/dashboard/inbox/${conv.id}`}
                style={{ textDecoration: "none", color: "inherit", flex: 1 }}
              >
                <div style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ margin: 0 }}>
                      {contact.name || contact.email || contact.phone || "Sin nombre"}
                    </h3>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                      {conv.channel}
                    </span>
                  </div>
                  {lastMessage && (
                    <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
                      {lastMessage.content.substring(0, 150)}
                      {lastMessage.content.length > 150 ? "..." : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#666", flexWrap: "wrap" }}>
                    <span>💬 {conv._count.messages} mensajes</span>
                    <span>Estado: {contact.conversationalStage}</span>
                    <span>Comercial: {contact.commercialStage}</span>
                  </div>
                </div>
              </Link>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                <Link href={`/dashboard/contacts/${contact.id}`} style={{ color: "#0070f3", fontSize: "0.8rem" }}>
                  Ficha contacto
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay conversaciones activas.</p>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Hilo por conversación + sugerencia IA y envío manual del borrador por
          WhatsApp (S12). Filtros avanzados en Fase 2.
        </p>
      </div>
    </div>
  );
}
