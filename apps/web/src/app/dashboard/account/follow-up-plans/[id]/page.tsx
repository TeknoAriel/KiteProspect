import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FollowUpPlanForm } from "../follow-up-plan-form";

export default async function FollowUpPlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const plan = await prisma.followUpPlan.findFirst({
    where: { id, accountId: session.user.accountId },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard/account/follow-up-plans" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Planes de seguimiento
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Editar plan</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>{plan.name}</p>
      <div style={{ marginTop: "1.5rem" }}>
        <FollowUpPlanForm
          plan={{
            id: plan.id,
            name: plan.name,
            description: plan.description,
            intensity: plan.intensity,
            maxAttempts: plan.maxAttempts,
            status: plan.status,
            sequence: plan.sequence,
          }}
        />
      </div>
    </div>
  );
}
