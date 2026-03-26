import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serializeProperty } from "@/domains/properties/property-serialization";
import { PropertyForm } from "../../property-form";
import { PropertyDeleteButton } from "../../property-delete-button";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  const row = await prisma.property.findFirst({
    where: { id, accountId: session.user.accountId },
  });
  if (!row) {
    notFound();
  }

  const initial = serializeProperty(row);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/properties" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Propiedades
      </Link>
      <h1 style={{ marginTop: "1rem" }}>{canMutate ? "Editar propiedad" : "Detalle"}</h1>
      <PropertyForm canMutate={canMutate} mode="edit" initial={initial} />
      {canMutate && <PropertyDeleteButton propertyId={initial.id} />}
    </div>
  );
}
