import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COMMERCIAL_STAGES,
  CONVERSATIONAL_STAGES,
  isCommercialStage,
  isConversationalStage,
} from "@/domains/crm-leads/contact-stage-constants";
import { ContactNotesForm } from "./contact-notes-form";
import { ContactNoteRow } from "./contact-note-row";
import { ContactTasksForm } from "./contact-tasks-form";
import { ContactTaskRow } from "./contact-task-row";
import { ContactAssignmentForm } from "./contact-assignment-form";
import { ContactStagesForm } from "./contact-stages-form";
import { FollowUpSequenceControls } from "./follow-up-sequence-controls";
import { StartFollowUpSequenceForm } from "./start-follow-up-sequence-form";
import { RecalculateMatchesButton } from "./recalculate-matches-button";
import { PropertyMatchFeedback } from "./property-match-feedback";
import { SendRecommendationWhatsAppButton } from "./send-recommendation-whatsapp-button";

function crmTaskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    call: "Llamada",
    visit: "Visita",
    followup: "Seguimiento",
    other: "Otro",
  };
  return map[type] ?? type;
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const { id } = await params;

  const [contact, advisors, followUpPlans, activeFollowUpSequence] = await Promise.all([
    prisma.contact.findFirst({
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
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        where: { status: "pending" },
        take: 20,
      },
      notes: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 20,
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
      followUpSequences: {
        include: {
          plan: { select: { name: true, maxAttempts: true } },
          attemptsList: {
            orderBy: { attemptedAt: "desc" },
            take: 20,
          },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      },
    },
  }),
    prisma.advisor.findMany({
      where: { accountId, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.followUpPlan.findMany({
      where: { accountId, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.followUpSequence.findFirst({
      where: { contactId: id, status: "active" },
      select: { id: true },
    }),
  ]);

  if (!contact) {
    notFound();
  }

  const completedTasks = await prisma.task.findMany({
    where: {
      contactId: id,
      status: { in: ["completed", "cancelled"] },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 15,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      completedAt: true,
      updatedAt: true,
    },
  });

  const commercialForSelect = isCommercialStage(contact.commercialStage)
    ? contact.commercialStage
    : COMMERCIAL_STAGES[0];
  const conversationalForSelect = isConversationalStage(contact.conversationalStage)
    ? contact.conversationalStage
    : CONVERSATIONAL_STAGES[0];

  const latestScore = contact.leadScores[0];
  const latestProfile = contact.searchProfiles[0];
  const canSendRecommendation =
    session.user.role === "admin" || session.user.role === "coordinator";
  const canMutateAssign =
    session.user.role === "admin" || session.user.role === "coordinator";
  const canMutateStages = canMutateAssign;
  const canMutateFollowUp = canMutateAssign;
  const hasPhoneForWa = Boolean(contact.phone?.trim());
  const canSetMatchFeedback =
    session.user.role === "admin" ||
    session.user.role === "coordinator" ||
    session.user.role === "advisor";
  const activeAssignment = contact.assignments[0];
  const currentAdvisorId = activeAssignment?.advisorId ?? null;

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
            <ContactStagesForm
              contactId={id}
              commercialStage={commercialForSelect}
              conversationalStage={conversationalForSelect}
              canMutate={canMutateStages}
            />
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
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0 }}>Tareas pendientes ({contact.tasks.length})</h2>
            <ContactTasksForm contactId={id} />
            {contact.tasks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.tasks.map((task) => (
                  <ContactTaskRow
                    key={task.id}
                    task={{
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      type: task.type,
                      dueAtIso: task.dueAt ? task.dueAt.toISOString() : null,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: "#666", marginTop: 0 }}>Sin tareas pendientes.</p>
            )}
          </section>

          {completedTasks.length > 0 ? (
            <section
              style={{
                padding: "1.5rem",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#fcfcfc",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Tareas cerradas recientes</h2>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "#666" }}>
                Hasta 15 últimas completadas o canceladas (solo lectura).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: "0.55rem 0.65rem",
                      backgroundColor: "#f2f2f2",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>{t.title}</strong>
                      <span style={{ marginLeft: "0.5rem", color: "#666" }}>
                        ({crmTaskTypeLabel(t.type)} · {t.status === "completed" ? "Hecha" : "Cancelada"})
                      </span>
                    </p>
                    {t.description ? (
                      <p style={{ margin: "0.2rem 0 0", color: "#444" }}>{t.description}</p>
                    ) : null}
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "#888" }}>
                      {t.completedAt
                        ? `Cerrada: ${new Date(t.completedAt).toLocaleString()}`
                        : `Actualizada: ${new Date(t.updatedAt).toLocaleString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Notas */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h2 style={{ marginTop: 0 }}>Notas ({contact.notes.length})</h2>
            <ContactNotesForm contactId={id} />
            {contact.notes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.notes.map((note) => (
                  <ContactNoteRow
                    key={note.id}
                    note={{
                      id: note.id,
                      content: note.content,
                      createdAtIso: note.createdAt.toISOString(),
                      updatedAtIso: note.updatedAt.toISOString(),
                    }}
                  />
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

          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Seguimiento automático</h3>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "#666" }}>
              El cron del servidor ejecuta pasos con fecha vencida (ver configuración de cuenta). Podés iniciar un plan
              para este contacto si no hay otro seguimiento activo.
            </p>
            <StartFollowUpSequenceForm
              contactId={id}
              plans={followUpPlans}
              canMutate={canMutateFollowUp}
              hasActiveSequence={Boolean(activeFollowUpSequence)}
            />
            {contact.followUpSequences.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {contact.followUpSequences.map((seq) => (
                  <div
                    key={seq.id}
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #eee",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                      <strong>{seq.plan.name}</strong> · estado <code>{seq.status}</code> · paso {seq.currentStep} ·
                      intentos {seq.attempts}/{seq.plan.maxAttempts}
                    </p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#666" }}>
                      Próximo paso:{" "}
                      {seq.nextAttemptAt
                        ? new Date(seq.nextAttemptAt).toLocaleString()
                        : seq.status === "active"
                          ? "—"
                          : "—"}
                    </p>
                    <FollowUpSequenceControls
                      sequenceId={seq.id}
                      status={seq.status}
                      planName={seq.plan.name}
                      canMutate={canMutateFollowUp}
                    />
                    {seq.attemptsList.length > 0 ? (
                      <ul
                        style={{
                          margin: "0.5rem 0 0",
                          paddingLeft: "1.1rem",
                          fontSize: "0.78rem",
                          color: "#444",
                        }}
                      >
                        {seq.attemptsList.map((a) => (
                          <li key={a.id} style={{ marginBottom: "0.25rem" }}>
                            {new Date(a.attemptedAt).toLocaleString()} · {a.channel} · paso {a.step}
                            {a.outcome ? ` · ${a.outcome}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "#666" }}>Sin secuencias en este contacto.</p>
            )}
          </section>

          {/* Matching inventario (v0) */}
          <section style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Propiedades recomendadas (matching)</h3>
            <p style={{ fontSize: "0.8rem", color: "#555", marginTop: 0 }}>
              Solo inventario <code>available</code>; pesos por cuenta en{" "}
              <Link href="/dashboard/account/matching" style={{ color: "#0070f3" }}>
                configuración → matching
              </Link>
              . Podés excluir IDs desde el perfil del contacto y marcar feedback; &quot;No interesa&quot; no se borra al
              recalcular. WhatsApp (admin/coordinator) registra <code>Recommendation</code> y <code>sentAt</code> (S20).
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "0.5rem",
                        minWidth: "min(100%, 200px)",
                      }}
                    >
                      <PropertyMatchFeedback
                        contactId={id}
                        matchId={match.id}
                        current={match.feedback}
                        canEdit={canSetMatchFeedback}
                      />
                      <SendRecommendationWhatsAppButton
                        contactId={id}
                        propertyMatchId={match.id}
                        canSend={canSendRecommendation}
                        hasPhone={hasPhoneForWa}
                        sentAt={match.sentAt}
                      />
                    </div>
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
          <strong>MVP:</strong> Matching v0, asignación, inicio y pausa de seguimiento desde esta ficha
          (admin/coordinador).
        </p>
      </div>
    </div>
  );
}
