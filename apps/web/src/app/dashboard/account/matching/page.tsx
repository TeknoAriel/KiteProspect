import { extractMatchingWeightsFromAccountConfig } from "@/domains/auth-tenancy/account-matching-config";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchingConfigForm } from "./matching-config-form";

export default async function AccountMatchingConfigPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { config: true },
  });

  const matchingWeights = extractMatchingWeightsFromAccountConfig(account?.config);

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
      <h1 style={{ marginTop: "1rem" }}>Matching (pesos por dimensión)</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        F2-E2 — ajuste comercial sin tocar código. Ver{" "}
        <code>docs/decisions/slice-l5-f2e2-matching-weights-feedback-exclusions.md</code>.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <MatchingConfigForm initial={matchingWeights} />
      </div>
    </div>
  );
}
