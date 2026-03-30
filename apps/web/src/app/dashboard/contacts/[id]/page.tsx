import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactNotesForm } from "./contact-notes-form";
import { RecalculateMatchesButton } from "./recalculate-matches-button";
import { SendRecommendationWhatsAppButton } from "./send-recommendation-whatsapp-button";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      accountId, // Seguridad: solo contactos de la cuenta
    },
    include: {
      conversations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 5,
          },
        },
      },
      searchProfiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      leadScores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tasks: {
        orderBy: { dueAt: "asc" },
        where: { status: "pending" },
        take: 5,
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      assignments: {
        where: { status: "active" },
        include: {
          advisor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      propertyMatches: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              zone: true,
            },
          },
        },
        orderBy: { score: "desc" },
        take: 50,
      },
      consents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  const latestScore = contact.leadScores[0];
  const latestProfile = contact.searchProfiles[0];
  const canSendRecommendation =
    session.user.role === "admin" || session.user.role === "coordinator";
  const hasPhoneForWa = Boolean(contact.phone?.trim());

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard/contacts" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver a contactos
        </Link>
        <h1 style={{ marginTop: "1rem" }}>{contact.name || contact.email || contact.phone || "Contacto sin nombre"}</h1>
        <nav style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <Link href={`/dashboard/contacts/${id}/profile`} style={{ color: "#0070f3" }}>
            Perfil declarado
          </Link>
          <Link href={`/dashboard/contacts/${id}/score`} style={{ color: "#0070f3" }}>
            Score
          </Link>
        </nav>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* Columna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Información básica */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0 }}>Información</h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {contact.email && <p><strong>Email:</strong> {contact.email}</p>}
              {contact.phone && <p><strong>Teléfono:</strong> {contact.phone}</p>}
              <p><strong>Estado conversacional:</strong> {contact.conversationalStage}</p>
              <p><strong>Estado comercial:</strong> {contact.commercialStage}</p>
            </div>
          </section>

          {/* Perfil de búsqueda */}
          {latestProfile && (
            <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h2 style={{ marginTop: 0 }}>Perfil de búsqueda</h2>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <p><strong>Intención:</strong> {latestProfile.intent || "N/A"}</p>
                <p><strong>Tipo:</strong> {latestProfile.propertyType || "N/A"}</p>
                <p><strong>Zona:</strong> {latestProfile.zone || "N/A"}</p>
                {latestProfile.maxPrice && (
                  <p><strong>Precio máximo:</strong> ${latestProfile.maxPrice.toLocaleString()}</p>
                )}
                {latestProfile.bedrooms && (
                  <p><strong>Dormitorios:</strong> {latestProfile.bedrooms}</p>
                )}
                <p><strong>Fuente:</strong> {latestProfile.source}</p>
              </div>
            </section>
          )}

          {/* Conversaciones */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0 }}>Conversaciones ({contact.conversations.length})</h2>
            {contact.conversations.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {contact.conversations.map((conv) => (
                  <div key={conv.id} style={{ padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
                      Canal: {conv.channel} | {new Date(conv.createdAt).toLocaleString()}
                    </p>
                    {conv.messages.length > 0 && (
                      <div style={{ fontSize: "0.875rem" }}>
                        {conv.messages.map((msg) => (
                          <p key={msg.id} style={{ margin: "0.25rem 0" }}>
                            <strong>{msg.direction === "inbound" ? "→" : "←"}</strong> {msg.content}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666" }}>Sin conversaciones</p>
            )}
          </section>

          {/* Tareas pendientes */}
          {contact.tasks.length > 0 && (
            <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h2 style={{ marginTop: 0 }}>Tareas pendientes</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.tasks.map((task) => (
                  <div key={task.id} style={{ padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <p style={{ margin: 0 }}><strong>{task.title}</strong></p>
                    {task.description && <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>{task.description}</p>}
                    {task.dueAt && (
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#666" }}>
                        Vence: {new Date(task.dueAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notas */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0 }}>Notas ({contact.notes.length})</h2>
            <ContactNotesForm contactId={id} />
            {contact.notes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.notes.map((note) => (
                  <div key={note.id} style={{ padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>{note.content}</p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666" }}>Sin notas</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Score */}
          {latestScore && (
            <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0 }}>Score</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <p><strong>Total:</strong> {latestScore.totalScore.toFixed(1)}</p>
                <p style={{ fontSize: "0.875rem" }}>Intent: {latestScore.intentScore}</p>
                <p style={{ fontSize: "0.875rem" }}>Readiness: {latestScore.readinessScore}</p>
                <p style={{ fontSize: "0.875rem" }}>Fit: {latestScore.fitScore}</p>
                <p style={{ fontSize: "0.875rem" }}>Engagement: {latestScore.engagementScore}</p>
              </div>
            </section>
          )}

          {/* Asignación */}
          {contact.assignments.length > 0 && (
            <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0 }}>Asignado a</h3>
              {contact.assignments.map((assignment) => (
                <div key={assignment.id}>
                  <p style={{ margin: 0 }}><strong>{assignment.advisor.name}</strong></p>
                  {assignment.advisor.email && (
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#666" }}>
                      {assignment.advisor.email}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Matching inventario (v0) */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Propiedades recomendadas (matching v0)</h3>
            <p style={{ fontSize: "0.8rem", color: "#555", marginTop: 0 }}>
              Solo inventario con estado <code>available</code>; reglas sobre perfil de búsqueda (sin inventar
              propiedades). Envío por WhatsApp (admin/coordinator) registra <code>Recommendation</code> y
              actualiza <code>sentAt</code> en el match (S20).
            </p>
            <RecalculateMatchesButton contactId={id} />
            {contact.propertyMatches.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                {contact.propertyMatches.map((match) => (
                  <div
                    key={match.id}
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: "1 1 200px" }}>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        <strong>{match.property.title}</strong>
                      </p>
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
                        {match.property.zone} | ${match.property.price.toLocaleString()} | Score: {match.score}%
                      </p>
                      {match.sentAt && (
                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.7rem", color: "#888" }}>
                          Último envío: {new Date(match.sentAt).toLocaleString()}
                        </p>
                      )}
                      {match.reason && (
                        <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.75rem", color: "#444" }}>{match.reason}</p>
                      )}
                    </div>
                    <SendRecommendationWhatsAppButton
                      contactId={id}
                      propertyMatchId={match.id}
                      canSend={canSendRecommendation}
                      hasPhone={hasPhoneForWa}
                      sentAt={match.sentAt}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.75rem" }}>
                Sin matches por encima del umbral. Necesitás perfil de búsqueda e inventario disponible; luego
                &quot;Recalcular matches&quot;.
              </p>
            )}
          </section>

          {/* Consentimientos */}
          {contact.consents.length > 0 && (
            <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0 }}>Consentimientos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.consents.map((consent) => (
                  <div key={consent.id} style={{ fontSize: "0.875rem" }}>
                    <p style={{ margin: 0 }}>
                      {consent.channel}: {consent.granted ? "✅ Otorgado" : "❌ No otorgado"}
                    </p>
                    {consent.grantedAt && (
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
                        {new Date(consent.grantedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Matching v0 recalcutable desde esta ficha; más edición CRM en Fase 2.
        </p>
      </div>
    </div>
  );
}
