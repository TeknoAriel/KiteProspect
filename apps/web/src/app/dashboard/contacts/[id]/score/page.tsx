import { contactWhereForAdvisorRole } from "@/domains/auth-tenancy/advisor-contact-scope";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recalculateContactScoreAction } from "./actions";

export default async function ContactScorePage({
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
      ...contactWhereForAdvisorRole(accountId, session),
    },
    include: {
      leadScores: {
        orderBy: { createdAt: "desc" },
        take: 10, // Historial
      },
    },
  });

  if (!contact) {
    notFound();
  }

  const latestScore = contact.leadScores[0];

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href={`/dashboard/contacts/${id}`} style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver a contacto
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Score del Lead</h1>
      </header>

      {latestScore ? (
        <>
          <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px", marginBottom: "2rem" }}>
            <h2 style={{ marginTop: 0 }}>Score actual (v{latestScore.version})</h2>
            <div style={{ fontSize: "3rem", fontWeight: "bold", margin: "1rem 0" }}>
              {latestScore.totalScore.toFixed(1)}
            </div>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Intent Score</span>
                  <span>{latestScore.intentScore.toFixed(1)}</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                  <div
                    style={{
                      width: `${latestScore.intentScore}%`,
                      height: "100%",
                      backgroundColor: "#0070f3",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Readiness Score</span>
                  <span>{latestScore.readinessScore.toFixed(1)}</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                  <div
                    style={{
                      width: `${latestScore.readinessScore}%`,
                      height: "100%",
                      backgroundColor: "#0070f3",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Fit Score</span>
                  <span>{latestScore.fitScore.toFixed(1)}</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                  <div
                    style={{
                      width: `${latestScore.fitScore}%`,
                      height: "100%",
                      backgroundColor: "#0070f3",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Engagement Score</span>
                  <span>{latestScore.engagementScore.toFixed(1)}</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                  <div
                    style={{
                      width: `${latestScore.engagementScore}%`,
                      height: "100%",
                      backgroundColor: "#0070f3",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {contact.leadScores.length > 1 && (
            <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0 }}>Historial</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {contact.leadScores.slice(1).map((score) => (
                  <div key={score.id} style={{ fontSize: "0.875rem", color: "#666" }}>
                    v{score.version}: {score.totalScore.toFixed(1)} ({new Date(score.createdAt).toLocaleString()})
                  </div>
                ))}
              </div>
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await recalculateContactScoreAction(id);
            }}
            style={{ marginTop: "2rem" }}
          >
            <button
              type="submit"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Recalcular score
            </button>
          </form>
        </>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>Este contacto aún no tiene score calculado.</p>
          <form
            action={async () => {
              "use server";
              await recalculateContactScoreAction(id);
            }}
            style={{ marginTop: "1rem" }}
          >
            <button
              type="submit"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Calcular score inicial
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Cálculo básico con reglas simples. Pesos configurables y ML en Fase 2.
        </p>
      </div>
    </div>
  );
}
