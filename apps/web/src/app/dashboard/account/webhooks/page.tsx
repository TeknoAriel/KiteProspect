import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@kite-prospect/db";
import { requireAuth } from "@/lib/server-utils";
import { WEBHOOK_EVENT_TYPES } from "@/domains/integrations/services/webhook-event-types";
import { WebhookSubscriptionsPanel } from "./webhook-subscriptions-panel";

export default async function WebhookSubscriptionsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rows = await prisma.webhookSubscription.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  const subscriptions = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString() ?? null,
    urlHint:
      r.url.length > 64 ? `${r.url.slice(0, 48)}…${r.url.slice(-12)}` : r.url,
  }));

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Webhooks salientes</h1>
      <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.5 }}>
        Recibí en tu servidor eventos firmados (cabecera{" "}
        <code>X-Kite-Signature: sha256=&lt;hex&gt;</code>): captura de lead, cambio de asignación,
        actualización de etapas comercial/conversacional del contacto e inicio de secuencia de
        seguimiento. Elegí cuáles activar abajo. El secreto se muestra una vez al crear la
        suscripción.
      </p>
      <WebhookSubscriptionsPanel
        initialSubs={subscriptions}
        eventTypes={[...WEBHOOK_EVENT_TYPES]}
      />
    </div>
  );
}
