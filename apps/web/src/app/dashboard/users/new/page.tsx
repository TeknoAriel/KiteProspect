import { requireAuth } from "@/lib/server-utils";
import Link from "next/link";
import { UserForm } from "../user-form";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function NewUserPage() {
  const session = await requireAuth();
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/users" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Usuarios
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Nuevo usuario</h1>
      <UserForm canMutate={canMutate} mode="create" />
    </div>
  );
}
