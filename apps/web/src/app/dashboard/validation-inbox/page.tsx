import Link from "next/link";
import { prisma } from "@kite-prospect/db";
import { requireAuth } from "@/lib/server-utils";
import { ValidationInboxClient, type ValidationRowVM } from "./validation-inbox-client";

const ROLES = new Set(["admin", "coordinator"]);

export default async function ValidationInboxPage() {
  const session = await requireAuth();
  if (!session.user.role || !ROLES.has(session.user.role)) {
    return (
      <div style={{ padding: "2rem", maxWidth: "36rem" }}>
        <h1 style={{ fontSize: "1.1rem" }}>Acceso restringido</h1>
        <p style={{ color: "#444", lineHeight: 1.5 }}>
          La validación de import KiteProp y los borradores solo están disponibles para usuarios{" "}
          <strong>administrador</strong> o <strong>coordinator</strong>. En el seed demo usá{" "}
          <code>admin@demo.local</code> (contraseña <code>demo123</code>) o creá un coordinator desde Usuarios.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/dashboard" style={{ color: "#0070f3" }}>
            ← Volver al dashboard
          </Link>
        </p>
      </div>
    );
  }

  const accountId = session.user.accountId;

  const items = await prisma.leadReplyDraftReview.findMany({
    where: { accountId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      lead: { select: { id: true, status: true, source: true } },
      property: { select: { id: true, title: true } },
      contact: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  const withScores = await Promise.all(
    items.map(async (r) => {
      const sc = await prisma.leadScore.findFirst({
        where: { leadId: r.leadId },
        orderBy: { createdAt: "desc" },
        select: { totalScore: true },
      });
      return { ...r, scoreTotal: sc?.totalScore ?? null };
    }),
  );

  const rows: ValidationRowVM[] = withScores.map((row) => ({
    id: row.id,
    reviewStatus: row.reviewStatus,
    sourceChannel: row.sourceChannel,
    channelConfidence: row.channelConfidence,
    manualReviewRequired: row.manualReviewRequired,
    draftKind: row.draftKind,
    scoreTotal: row.scoreTotal,
    leadId: row.leadId,
    contactId: row.contactId,
    leadLine: `${row.lead.status} · ${row.lead.source}`,
    propertyTitle: row.property?.title ?? null,
    draftPayload: row.draftPayload,
    editedPayload: row.editedPayload,
  }));

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Validación import KiteProp</h1>
        <p style={{ color: "#555", margin: 0, fontSize: "0.9rem" }}>
          Leads reales importados por API, borradores sugeridos y revisión antes de enviar. Con{" "}
          <code>KITEPROP_IMPORT_REVIEW_MODE=true</code> los seguimientos automáticos no envían; el botón
          Enviar aquí usa despacho manual auditado (WhatsApp / email).
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <Link href="/dashboard" style={{ color: "#0070f3" }}>
            ← Dashboard
          </Link>
        </p>
      </header>

      <ValidationInboxClient rows={rows} />

      {rows.length === 0 && (
        <p style={{ color: "#666", marginTop: "1rem" }}>
          No hay borradores. Ejecutá{" "}
          <code>npm run kiteprop:import:last-week</code> o POST interno{" "}
          <code>/api/internal/kiteprop-import/run</code>.
        </p>
      )}
    </div>
  );
}
