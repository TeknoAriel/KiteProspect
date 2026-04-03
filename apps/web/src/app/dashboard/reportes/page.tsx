import { formatChannelLabel } from "@/domains/analytics/channel-label";
import { getOperationalReportsForAccount } from "@/domains/analytics/get-operational-reports";
import { requireAuth } from "@/lib/server-utils";
import Link from "next/link";

export default async function ReportesPage() {
  const session = await requireAuth();
  const reports = await getOperationalReportsForAccount(session.user.accountId);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver al panel
        </Link>
        <h1 style={{ marginTop: "1rem", marginBottom: "0.35rem" }}>Reportes operativos</h1>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0, maxWidth: "40rem" }}>
          Resumen por tenant (sin exportación). Paso hacia F2-E7; los “nuevos contactos” usan la{" "}
          <strong>primera conversación</strong> por orden de creación para atribuir canal.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.25rem",
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            background: "#fafbff",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.35rem" }}>
            Nuevos contactos ({reports.periodDays} días)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#0070f3" }}>
            {reports.newContactsInPeriod}
          </div>
        </div>
        <Link
          href="/dashboard/followups"
          style={{
            padding: "1.25rem",
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            background: "#fff",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.35rem" }}>Seguimientos activos</div>
          <div style={{ fontSize: "1.85rem", fontWeight: 700 }}>{reports.activeFollowUpSequencesCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#0070f3", marginTop: "0.35rem" }}>Ver planes →</div>
        </Link>
        <div
          style={{
            padding: "1.25rem",
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.35rem" }}>Tareas pendientes</div>
          <div style={{ fontSize: "1.85rem", fontWeight: 700 }}>{reports.pendingTasksCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.35rem" }}>En fichas de contacto</div>
        </div>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Nuevos contactos por canal (primer hilo)
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Solo contactos creados en los últimos {reports.periodDays} días (UTC).
        </p>
        {reports.newContactsByFirstChannel.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#666" }}>No hay altas en este período.</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #e8e8e8", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#fafafa", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Canal</th>
                  <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Contactos</th>
                </tr>
              </thead>
              <tbody>
                {reports.newContactsByFirstChannel.map((row) => (
                  <tr key={row.channel}>
                    <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f0f0f0" }}>
                      {formatChannelLabel(row.channel)}
                    </td>
                    <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f0f0f0" }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Embudo conversacional (todos los contactos)</h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Distribución actual de <code>conversationalStage</code>.
        </p>
        {reports.conversationalStageCounts.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#666" }}>Sin datos.</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #e8e8e8", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#fafafa", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Etapa</th>
                  <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Contactos</th>
                </tr>
              </thead>
              <tbody>
                {reports.conversationalStageCounts.map((row) => (
                  <tr key={row.stage}>
                    <td
                      style={{
                        padding: "0.45rem 0.75rem",
                        borderBottom: "1px solid #f0f0f0",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                      }}
                    >
                      {row.stage}
                    </td>
                    <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f0f0f0" }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ fontSize: "0.8rem", color: "#888" }}>
        ¿Necesitás el detalle por persona?{" "}
        <Link href="/dashboard/contacts" style={{ color: "#0070f3" }}>
          Lista de contactos
        </Link>{" "}
        ·{" "}
        <Link href="/dashboard" style={{ color: "#0070f3" }}>
          Operaciones (gráficos)
        </Link>
      </p>
    </div>
  );
}
