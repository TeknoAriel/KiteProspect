import { requireAuth } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { DashboardTour } from "./dashboard-tour";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await requireAuth();
    return (
      <div>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Kite Prospect</strong> | {session.user.email} ({session.user.role})
          </div>
          <form action={async () => {
            "use server";
            await signOut();
            redirect("/login");
          }}>
            <button type="submit" style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </form>
        </nav>
        <DashboardTour />
        {children}
      </div>
    );
  } catch {
    redirect("/login");
  }
}
