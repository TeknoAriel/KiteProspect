import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@kite-prospect/db";
import { findDuplicateExternalIdsForAccount } from "@/domains/crm-leads/duplicate-external-ids-for-account";
import { requireAuth } from "@/lib/server-utils";

export default async function CrmExternalDiagnosticsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const accountId = session.user.accountId;

  const [contactsWithExternalId, duplicateGroups] = await Promise.all([
    prisma.contact.count({
      where: { accountId, externalId: { not: null } },
    }),
    findDuplicateExternalIdsForAccount(accountId),
  ]);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Diagnóstico — CRM externo (`externalId`)</h1>
      <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.5 }}>
        Comprueba si hay <strong>duplicados</strong> del mismo ID de CRM en varios contactos del tenant. Con el índice
        único (L27) no deberían existir; si aparecen filas, corregí datos antes de migrar o contactá soporte.
      </p>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        API JSON (misma sesión): <code>/api/account/diagnostics/crm-external</code>
      </p>

      <div style={{ marginTop: "1.25rem", padding: "0.75rem", background: "#f6f8fa", borderRadius: "6px" }}>
        <strong>Contactos con `externalId` definido:</strong> {contactsWithExternalId}
        <br />
        <strong>Grupos duplicados:</strong> {duplicateGroups.length}
      </div>

      {duplicateGroups.length > 0 ? (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ color: "#b00020", fontSize: "0.9rem" }}>Se detectaron duplicados por valor de `externalId`:</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "0.35rem" }}>externalId</th>
                <th style={{ padding: "0.35rem" }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {duplicateGroups.map((r) => (
                <tr key={r.externalId} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.35rem", wordBreak: "break-all" }}>{r.externalId}</td>
                  <td style={{ padding: "0.35rem" }}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ marginTop: "1rem", color: "#0a0", fontSize: "0.9rem" }}>
          No hay duplicados agrupados por `externalId` en esta cuenta.
        </p>
      )}
    </div>
  );
}
