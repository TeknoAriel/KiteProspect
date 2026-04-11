import { DemoChannelsClient } from "./demo-channels-client";
import { requireAuth } from "@/lib/server-utils";
import { redirect } from "next/navigation";

const ALLOWED = new Set(["admin", "coordinator"]);

export default async function DemoChannelsPage() {
  const session = await requireAuth();
  if (!session.user.role || !ALLOWED.has(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <DemoChannelsClient />
    </div>
  );
}
