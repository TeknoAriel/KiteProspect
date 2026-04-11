import { DemoSimulationRunView } from "./demo-simulation-run-view";
import { requireAuth } from "@/lib/server-utils";
import { redirect } from "next/navigation";

const ALLOWED = new Set(["admin", "coordinator"]);

export default async function DemoSimulationRunPage() {
  const session = await requireAuth();
  if (!session.user.role || !ALLOWED.has(session.user.role)) {
    redirect("/dashboard");
  }

  return <DemoSimulationRunView />;
}
