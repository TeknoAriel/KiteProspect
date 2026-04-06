import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CaptureApiKeysPanel } from "./capture-api-keys-panel";

export default async function CaptureApiKeysPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rows = await prisma.captureApiKey.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  const initialKeys = rows.map((k) => ({
    id: k.id,
    name: k.name,
    keyHint: `kp_${k.keyPrefix}_…`,
    createdAt: k.createdAt.toISOString(),
    revokedAt: k.revokedAt?.toISOString() ?? null,
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
      <h1 style={{ marginTop: "1rem" }}>API de captura (por cuenta)</h1>
      <p style={{ color: "#666", fontSize: "0.875rem", maxWidth: "42rem", lineHeight: 1.5 }}>
        Claves para <code>POST /api/contacts/create</code> con <code>Authorization: Bearer …</code>. Alternativa al
        secreto global <code>CAPTURE_API_SECRET</code> del hosting: si no definís el global, cada tenant puede usar solo
        sus claves generadas aquí.
      </p>
      <CaptureApiKeysPanel initialKeys={initialKeys} />
    </div>
  );
}
