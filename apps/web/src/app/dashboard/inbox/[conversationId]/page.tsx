import { ConversationAiPanel } from "./conversation-ai-panel";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";

const MESSAGE_LIMIT = 200;

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const { conversationId } = await params;

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId },
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
        orderBy: { createdAt: "asc" },
        take: MESSAGE_LIMIT,
      },
    },
  });

  if (!conv) {
    notFound();
  }

  const contact = conv.contact;

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/dashboard/inbox"
          style={{ textDecoration: "none", color: "#0070f3" }}
        >
          ← Inbox
        </Link>
        <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>
          {contact.name || contact.email || contact.phone || "Sin nombre"}
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          Canal: <strong>{conv.channel}</strong> · Conv.{" "}
          <code style={{ fontSize: "0.8em" }}>{conv.id}</code>
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          <Link
            href={`/dashboard/contacts/${contact.id}`}
            style={{ color: "#0070f3" }}
          >
            Ficha del contacto
          </Link>
        </p>
      </header>

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          maxHeight: "480px",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Mensajes</h2>
        {conv.messages.length === 0 ? (
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Sin mensajes.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {conv.messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  backgroundColor:
                    m.direction === "inbound" ? "#f0f7ff" : "#f5f5f5",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#666",
                    marginBottom: "0.35rem",
                  }}
                >
                  {m.direction === "inbound" ? "Lead" : "Equipo"} ·{" "}
                  {new Date(m.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
        {conv.messages.length >= MESSAGE_LIMIT && (
          <p style={{ fontSize: "0.75rem", color: "#666", marginBottom: 0 }}>
            Mostrando los últimos {MESSAGE_LIMIT} mensajes.
          </p>
        )}
      </section>

      <ConversationAiPanel
        conversationId={conv.id}
        contactId={contact.id}
        channel={conv.channel}
        userRole={session.user.role ?? "advisor"}
      />
    </div>
  );
}
