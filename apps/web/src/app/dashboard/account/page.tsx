import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountSettingsHubPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: {
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!account) {
    redirect("/dashboard");
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Dashboard
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Configuración de la cuenta</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        F1-E2 (MVP): lectura de datos de tenant y accesos a ajustes persistidos en{" "}
        <code>Account.config</code>. El slug no se edita aquí.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Datos del tenant</h2>
        <dl style={{ margin: 0, fontSize: "0.875rem", display: "grid", gap: "0.5rem" }}>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Nombre</dt>
            <dd style={{ margin: 0 }}>{account.name}</dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Slug (login)</dt>
            <dd style={{ margin: 0 }}>
              <code>{account.slug}</code>
            </dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Estado</dt>
            <dd style={{ margin: 0 }}>{account.status}</dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Última actualización</dt>
            <dd style={{ margin: 0 }}>{account.updatedAt.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Ajustes</h2>
        <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard/account/ai-prompt" style={{ color: "#0070f3" }}>
              IA conversacional
            </Link>
            <span style={{ color: "#666" }}> — versión de prompt y texto adicional (S12)</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
