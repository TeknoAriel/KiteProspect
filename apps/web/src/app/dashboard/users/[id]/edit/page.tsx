import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serializeUser } from "@/domains/users/user-serialization";
import { UserDeleteButton } from "../../user-delete-button";
import { UserForm } from "../../user-form";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  const row = await prisma.user.findFirst({
    where: { id, accountId: session.user.accountId },
    include: { _count: { select: { advisors: true } } },
  });
  if (!row) notFound();

  const initial = serializeUser(row);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/dashboard/users" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Usuarios
      </Link>
      <h1 style={{ marginTop: "1rem" }}>{canMutate ? "Editar usuario" : "Detalle de usuario"}</h1>
      <UserForm canMutate={canMutate} mode="edit" initial={initial} />
      {canMutate && <UserDeleteButton userId={initial.id} disabled={initial.id === session.user.id} />}
    </div>
  );
}
