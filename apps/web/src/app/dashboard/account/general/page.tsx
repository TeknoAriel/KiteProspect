import { requireAuth } from "@/lib/server-utils";
import { extractGeneralFromAccountConfig } from "@/domains/auth-tenancy/account-general-config";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GeneralConfigForm } from "./general-config-form";

export default async function AccountGeneralSettingsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { name: true, config: true },
  });

  if (!account) {
    redirect("/dashboard");
  }

  const general = extractGeneralFromAccountConfig(account.config);

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
      <h1 style={{ marginTop: "1rem" }}>Ajustes generales (cuenta)</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        MVP F1-E2: edición de nombre de cuenta y timezone en{" "}
        <code>Account.config</code>. Solo administradores.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <GeneralConfigForm
          initial={{ name: account.name, timezone: general.timezone ?? "" }}
        />
      </div>
    </div>
  );
}
