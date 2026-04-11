import { requireAuth } from "@/lib/server-utils";
import { contactWhereForAdvisorRole } from "@/domains/auth-tenancy/advisor-contact-scope";
import { prisma } from "@kite-prospect/db";
import { FOLLOW_UP_INTENSITY_LABEL_ES } from "@/domains/core-prospeccion/follow-up-intensity";
import { normalizePlanIntensity } from "@/domains/core-prospeccion/follow-up-intensity-normalize";
import Link from "next/link";

export default async function FollowUpsPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  const [plans, sequences] = await Promise.all([
    prisma.followUpPlan.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            sequences: true,
          },
        },
      },
    }),
    prisma.followUpSequence.findMany({
      where: {
        contact: contactWhereForAdvisorRole(accountId, session),
        plan: { accountId },
        status: "active",
      },
      orderBy: { nextAttemptAt: "asc" },
      take: 20,
      include: {
        plan: {
          select: {
            name: true,
            maxAttempts: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        attemptsList: {
          orderBy: { attemptedAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Seguimiento</h1>
      </header>

      <div style={{ display: "grid", gap: "2rem" }}>
        {/* Planes de seguimiento */}
        <section>
          <h2>Planes de seguimiento</h2>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ margin: "0 0 0.5rem 0" }}>{plan.name}</h3>
                {plan.description && (
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
                    {plan.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666" }}>
                  <span>
                    Intensidad: {FOLLOW_UP_INTENSITY_LABEL_ES[normalizePlanIntensity(plan.intensity)]} (
                    {normalizePlanIntensity(plan.intensity)})
                  </span>
                  <span>Máx intentos: {plan.maxAttempts}</span>
                  <span>Secuencias activas: {plan._count.sequences}</span>
                  <span>Estado: {plan.status}</span>
                </div>
              </div>
            ))}
          </div>
          {plans.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic" }}>No hay planes de seguimiento configurados.</p>
          )}
        </section>

        {/* Secuencias activas */}
        <section>
          <h2>Próximos seguimientos</h2>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {sequences.map((seq) => {
              const lastAttempt = seq.attemptsList[0];
              const contact = seq.contact;

              return (
                <Link
                  key={seq.id}
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
                      <h3 style={{ margin: "0 0 0.5rem 0" }}>
                        {contact.name || contact.email || contact.phone || "Sin nombre"}
                      </h3>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666" }}>
                        <span>Plan: {seq.plan.name}</span>
                        <span>Paso: {seq.currentStep}</span>
                        <span>Intentos: {seq.attempts}/{seq.plan.maxAttempts}</span>
                        {lastAttempt && (
                          <span>Último: {new Date(lastAttempt.attemptedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#666" }}>
                      {seq.nextAttemptAt ? (
                        <div>
                          <div style={{ fontWeight: "bold" }}>Próximo:</div>
                          <div>{new Date(seq.nextAttemptAt).toLocaleString()}</div>
                        </div>
                      ) : (
                        <span>Sin programar</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {sequences.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic" }}>No hay secuencias activas.</p>
          )}
        </section>
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
          <strong>Cron:</strong> <code>/api/cron/follow-up-due</code> procesa secuencias vencidas ({" "}
          <code>docs/decisions/slice-s07-follow-up-cron.md</code>). <code>whatsapp</code> envía por Meta si está
          configurado; <code>email</code> usa Resend si <code>RESEND_API_KEY</code> y{" "}
          <code>FOLLOW_UP_FROM_EMAIL</code> están en el entorno; si no, crea una tarea en la ficha.{" "}
          <code>instagram</code> u otros canales generan tarea para acción manual.
        </p>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
          <strong>Editar planes (admin):</strong>{" "}
          <Link href="/dashboard/account/follow-up-plans" style={{ color: "#0070f3" }}>
            Centro de configuración → Planes de seguimiento
          </Link>
          .
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>Pausar / reanudar:</strong> desde la ficha del contacto (admin o coordinador). Las secuencias en pausa no
          entran en el cron y no se listan aquí como activas.
        </p>
      </div>
    </div>
  );
}
