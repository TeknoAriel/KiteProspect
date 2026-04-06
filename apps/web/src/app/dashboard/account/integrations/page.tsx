import { readPageIdFromIntegrationConfig } from "@/domains/integrations/meta-lead-page-id";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IntegrationsMetaForms, type MetaLeadAdsRow } from "./integrations-meta-forms";

function safeIntegrationSummary(
  type: string,
  provider: string | null,
  config: unknown,
): string {
  if (type === "meta_lead_ads") {
    const pageId = readPageIdFromIntegrationConfig(config);
    if (pageId) {
      return `Meta Lead Ads — pageId ${pageId}`;
    }
    return "Meta Lead Ads (sin pageId en config)";
  }
  const p = provider?.trim();
  return p ? `${type} (${p})` : type;
}

export default async function AccountIntegrationsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rows = await prisma.integration.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      config: true,
      updatedAt: true,
    },
  });

  const metaRows: MetaLeadAdsRow[] = rows
    .filter((r) => r.type === "meta_lead_ads")
    .map((r) => ({
      id: r.id,
      pageId: readPageIdFromIntegrationConfig(r.config) ?? "",
      status: r.status,
    }));

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Integraciones</h1>
      <p style={{ color: "#666", fontSize: "0.875rem", maxWidth: "42rem", lineHeight: 1.5 }}>
        Filas <code>Integration</code> de esta cuenta. Los <strong>secretos</strong> de Meta siguen solo en el hosting (
        <code>META_LEAD_WEBHOOK_*</code>). El webhook <code>GET/POST /api/webhooks/meta-leads</code> resuelve el tenant
        por <code>config.pageId</code>.
      </p>

      {rows.length === 0 ? (
        <p style={{ marginTop: "1.25rem", color: "#555", fontSize: "0.9rem" }}>
          No hay integraciones registradas. Podés crear Meta Lead Ads abajo o ver{" "}
          <code>docs/manual-actions-required.md</code> §6b.
        </p>
      ) : (
        <div style={{ marginTop: "1.25rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "0.45rem" }}>Resumen</th>
                <th style={{ padding: "0.45rem" }}>Estado</th>
                <th style={{ padding: "0.45rem" }}>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem", verticalAlign: "top" }}>
                    <code style={{ fontSize: "0.8rem", color: "#333" }}>{r.type}</code>
                    <div style={{ marginTop: "0.25rem", color: "#444" }}>
                      {safeIntegrationSummary(r.type, r.provider, r.config)}
                    </div>
                  </td>
                  <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>{r.status}</td>
                  <td style={{ padding: "0.5rem", color: "#666", whiteSpace: "nowrap" }}>
                    {r.updatedAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IntegrationsMetaForms metaRows={metaRows} />
    </div>
  );
}
