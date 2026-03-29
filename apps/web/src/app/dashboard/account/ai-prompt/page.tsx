import { AiPromptConfigForm } from "./ai-prompt-form";
import { requireAuth } from "@/lib/server-utils";
import { extractAiPromptFromAccountConfig } from "@/domains/auth-tenancy/account-ai-prompt-config";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountAiPromptPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { config: true },
  });

  const initial = extractAiPromptFromAccountConfig(account?.config);

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
      <h1 style={{ marginTop: "1rem" }}>IA conversacional (cuenta)</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Overrides guardados en <code>Account.config</code>. Solo administradores. Ver{" "}
        <code>docs/decisions/slice-s12-inbox-ai-assist.md</code> en el repositorio.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <AiPromptConfigForm initial={initial} />
      </div>
    </div>
  );
}
