import { formatChannelLabel } from "@/domains/analytics/channel-label";
import {
  buildOperationalReportsExportUrl,
  buildReportesDashboardUrl,
  parseOperationalReportBranchIdParam,
  resolveOperationalBranchFilter,
} from "@/domains/analytics/operational-reports-branch";
import {
  OPERATIONAL_REPORT_PERIOD_OPTIONS,
  parseOperationalReportPeriodDays,
} from "@/domains/analytics/operational-reports-period";
import { getOperationalReportsForAccount } from "@/domains/analytics/get-operational-reports";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

function formatMinutes(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return min > 0 ? `${h} h ${min} min` : `${h} h`;
  }
  const rounded = Math.round(m * 10) / 10;
  return `${rounded} min`;
}

export default async function ReportesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const sp = (await props.searchParams) ?? {};
  const daysRaw = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const periodDays = parseOperationalReportPeriodDays(daysRaw);
  const branchParam = parseOperationalReportBranchIdParam(
    Array.isArray(sp.branchId) ? sp.branchId[0] : sp.branchId,
  );
  const [{ branchId, branchFilter }, branches] = await Promise.all([
    resolveOperationalBranchFilter(accountId, branchParam, session),
    prisma.branch.findMany({
      where: { accountId, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  const reports = await getOperationalReportsForAccount(accountId, {
    session,
    periodDays,
    branchId,
    branchFilter,
  });
  const fr = reports.firstResponseTime;
  const scopeLabel = reports.branchFilter
    ? `Sucursal: ${reports.branchFilter.name}`
    : "Todas las sucursales";
  const advisorBid = session.user.role === "advisor" ? session.user.advisorBranchId : null;
  const branchesForNav =
    advisorBid ? branches.filter((b) => b.id === advisorBid) : branches;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver al panel
        </Link>
        <h1 style={{ marginTop: "1rem", marginBottom: "0.35rem" }}>Reportes operativos</h1>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0, maxWidth: "42rem" }}>
          Resumen por tenant (F2-E7). Los “nuevos contactos” usan la{" "}
          <strong>primera conversación</strong> por orden de creación para atribuir canal. La{" "}
          <strong>primera respuesta</strong> mide el tiempo entre el primer mensaje entrante y el primer
          mensaje saliente del equipo en el mismo hilo; solo hilos cuya primera entrada cae en el período
          (UTC).
        </p>
        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#555" }}>
          Ventana principal:{" "}
          {OPERATIONAL_REPORT_PERIOD_OPTIONS.map((d, i) => (
            <span key={d}>
              {i > 0 ? " · " : ""}
              {d === reports.periodDays ? (
                <strong>{d} días</strong>
              ) : (
                <Link
                  href={buildReportesDashboardUrl({ days: d, branchId: reports.branchFilter?.id })}
                  style={{ color: "#0070f3" }}
                >
                  {d} días
                </Link>
              )}
            </span>
          ))}{" "}
          (UTC). Cohorte de 4×7 días debajo es fija (tendencia de altas).
        </p>
        {branchesForNav.length > 0 ? (
          <p style={{ marginTop: "0.65rem", fontSize: "0.85rem", color: "#444" }}>
            <strong>Alcance:</strong> {scopeLabel}
            {advisorBid ? (
              <span style={{ marginLeft: "0.35rem", color: "#666" }}>
                (solo tu sucursal y pool sin sucursal)
              </span>
            ) : null}
            {" · "}
            <Link
              href={buildReportesDashboardUrl({ days: reports.periodDays, branchId: null })}
              style={{
                color: reports.branchFilter ? "#0070f3" : "#333",
                fontWeight: reports.branchFilter ? 400 : 700,
              }}
            >
              Todas
            </Link>
            {branchesForNav.map((b) => (
              <span key={b.id}>
                {" · "}
                <Link
                  href={buildReportesDashboardUrl({ days: reports.periodDays, branchId: b.id })}
                  style={{
                    color: "#0070f3",
                    fontWeight: reports.branchFilter?.id === b.id ? 700 : 400,
                  }}
                >
                  {b.name}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        <p style={{ marginTop: "0.75rem" }}>
          <a
            href={buildOperationalReportsExportUrl({
              days: reports.periodDays,
              branchId: reports.branchFilter?.id,
            })}
            style={{
              display: "inline-block",
              padding: "0.45rem 0.9rem",
              background: "#0070f3",
              color: "#fff",
              borderRadius: 8,
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Descargar CSV
          </a>
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
          Cohorte de nuevos contactos (ventanas de 7 días, UTC)
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Misma lógica que el CSV (sección <code style={{ fontSize: "0.78rem" }}>cohorte_7d</code>). Tendencia de
          altas en bloques recientes (F3-E6).
        </p>
        <div style={{ overflowX: "auto", border: "1px solid #e8e8e8", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#fafafa", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Ventana</th>
                <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Nuevos contactos</th>
              </tr>
            </thead>
            <tbody>
              {reports.cohortRollingWeeks.map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f0f0f0" }}>{row.label}</td>
                  <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f0f0f0" }}>{row.newContacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Primera respuesta del equipo (SLA)</h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Hilos con primera entrada en los últimos {reports.periodDays} días (UTC):{" "}
          <strong>{fr.conversationsWithFirstInboundInPeriod}</strong> con mensaje entrante;{" "}
          <strong>{fr.conversationsWithFirstOutboundAfterInbound}</strong> con al menos una respuesta saliente
          posterior.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div style={{ padding: "1rem", border: "1px solid #e8e8e8", borderRadius: 8, background: "#fffbeb" }}>
            <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "0.25rem" }}>Mediana</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{formatMinutes(fr.medianMinutesFirstResponse)}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff" }}>
            <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "0.25rem" }}>Promedio</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{formatMinutes(fr.meanMinutesFirstResponse)}</div>
          </div>
        </div>
      </section>

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
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Embudo conversacional ({reports.branchFilter ? `sucursal “${reports.branchFilter.name}”` : "todo el tenant"})
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Distribución actual de <code>conversationalStage</code> en el alcance seleccionado.
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

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Embudo comercial ({reports.branchFilter ? `sucursal “${reports.branchFilter.name}”` : "todo el tenant"})
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Distribución actual de <code>commercialStage</code> en el alcance seleccionado.
        </p>
        {reports.commercialStageCounts.length === 0 ? (
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
                {reports.commercialStageCounts.map((row) => (
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
