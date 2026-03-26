import { requireAuth } from "@/lib/server-utils";
import Link from "next/link";
import { PropertyForm } from "../property-form";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function NewPropertyPage() {
  const session = await requireAuth();
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/properties" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Propiedades
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Nueva propiedad</h1>
      <PropertyForm canMutate={canMutate} mode="create" />
    </div>
  );
}
