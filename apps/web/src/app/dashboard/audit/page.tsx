import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function AuditPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  // Solo admin puede ver auditoría
  if (session.user.role !== "admin") {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  const events = await prisma.auditEvent.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take: 100, // MVP: limitar a 100
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Auditoría</h1>
      </header>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              padding: "1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontWeight: "bold" }}>{event.action}</span>
                <span style={{ color: "#666" }}>
                  {event.entityType}:{event.entityId}
                </span>
                {event.actorId && (
                  <span style={{ color: "#666" }}>
                    por {event.actorType} {event.actorId}
                  </span>
                )}
              </div>
              {event.changes && (
                <pre style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
                  {JSON.stringify(event.changes, null, 2)}
                </pre>
              )}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666" }}>
              {new Date(event.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay eventos de auditoría aún.</p>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Vista básica. Filtros, búsqueda y exportación en Fase 2.
        </p>
      </div>
    </div>
  );
}
