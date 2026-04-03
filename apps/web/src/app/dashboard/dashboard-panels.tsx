import Link from "next/link";
import { formatChannelLabel } from "@/domains/analytics/channel-label";
import type { DashboardKpis } from "@/domains/analytics/get-dashboard-kpis";

const ACCENT = "#0070f3";
const MUTED = "#666";
const BAR_BG = "#e8f4ff";

export function DashboardPipelineBars(props: { rows: { stage: string; count: number }[] }) {
  if (props.rows.length === 0) return null;
  const max = Math.max(1, ...props.rows.map((r) => r.count));
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {props.rows.map((row) => (
        <div key={row.stage}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              marginBottom: "0.2rem",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontFamily: "monospace", color: "#333" }}>{row.stage}</span>
            <strong>{row.count}</strong>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 5,
              background: "#f0f0f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((row.count / max) * 100)}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #5aa9ff)`,
                borderRadius: 5,
                minWidth: row.count > 0 ? 4 : 0,
                transition: "width 0.35s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardChannelChips(props: { rows: { channel: string; count: number }[] }) {
  if (props.rows.length === 0) {
    return <p style={{ fontSize: "0.85rem", color: MUTED, margin: 0 }}>Sin conversaciones aún.</p>;
  }
  const max = Math.max(1, ...props.rows.map((r) => r.count));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {props.rows.map((row) => (
        <div
          key={row.channel}
          title={`${row.count} conversaciones`}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: 999,
            background: BAR_BG,
            border: "1px solid #cce4ff",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>{formatChannelLabel(row.channel)}</span>
          <span style={{ fontWeight: 700, color: ACCENT }}>{row.count}</span>
          <span style={{ width: 48, height: 4, background: "#ddeeff", borderRadius: 2, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                height: "100%",
                width: `${Math.round((row.count / max) * 100)}%`,
                background: ACCENT,
                borderRadius: 2,
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardContactsTrend(props: { days: { day: string; count: number }[] }) {
  const max = Math.max(1, ...props.days.map((d) => d.count));
  const barMaxPx = 88;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        minHeight: 112,
        padding: "0.5rem 0",
      }}
    >
      {props.days.map((d) => {
        const hPx = d.count === 0 ? 3 : Math.max(6, Math.round((d.count / max) * barMaxPx));
        return (
          <div
            key={d.day}
            title={`${d.day}: ${d.count} contactos`}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 20,
                height: hPx,
                background: d.count > 0 ? ACCENT : "#e8e8e8",
                borderRadius: 4,
              }}
            />
            <span style={{ fontSize: "0.6rem", color: MUTED }}>{d.day.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardRecentContacts(props: {
  contacts: DashboardKpis["recentContacts"];
}) {
  if (props.contacts.length === 0) {
    return <p style={{ fontSize: "0.85rem", color: MUTED, margin: 0 }}>No hay contactos.</p>;
  }
  return (
    <div style={{ overflowX: "auto", border: "1px solid #e8e8e8", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#fafafa", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Contacto</th>
            <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Etapa</th>
            <th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>Alta</th>
          </tr>
        </thead>
        <tbody>
          {props.contacts.map((c) => {
            const label = c.name?.trim() || c.email || c.phone || "Sin nombre";
            return (
              <tr key={c.id}>
                <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f4f4f4" }}>
                  <Link href={`/dashboard/contacts/${c.id}`} style={{ color: ACCENT, fontWeight: 500 }}>
                    {label}
                  </Link>
                  {c.email && c.name?.trim() ? (
                    <div style={{ fontSize: "0.75rem", color: MUTED }}>{c.email}</div>
                  ) : null}
                </td>
                <td
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderBottom: "1px solid #f4f4f4",
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                  }}
                >
                  {c.commercialStage}
                </td>
                <td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid #f4f4f4", color: MUTED }}>
                  {c.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
