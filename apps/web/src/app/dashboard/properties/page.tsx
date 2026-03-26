import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { serializeProperty } from "@/domains/properties/property-serialization";

const CAN_MUTATE = new Set(["admin", "coordinator"]);

export default async function PropertiesListPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;

  const rows = await prisma.property.findMany({
    where: { accountId },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
            ← Volver
          </Link>
          <h1 style={{ marginTop: "1rem" }}>Propiedades</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Inventario del tenant (F1-E4). Matching y recomendaciones usan solo filas reales.
          </p>
        </div>
        {canMutate && (
          <Link
            href="/dashboard/properties/new"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
            }}
          >
            Nueva propiedad
          </Link>
        )}
      </header>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {rows.map((p) => {
          const s = serializeProperty(p);
          return (
            <div
              key={s.id}
              style={{
                padding: "1.25rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h2 style={{ margin: "0 0 0.35rem 0", fontSize: "1.1rem" }}>{s.title}</h2>
                <div style={{ fontSize: "0.875rem", color: "#666", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <span>
                    {s.type} · {s.intent}
                  </span>
                  {s.zone && <span>{s.zone}</span>}
                  <span>
                    Precio: {s.price} · Estado: {s.status}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {canMutate ? (
                  <Link href={`/dashboard/properties/${s.id}/edit`} style={{ color: "#0070f3", fontSize: "0.875rem" }}>
                    Editar
                  </Link>
                ) : (
                  <Link href={`/dashboard/properties/${s.id}/edit`} style={{ color: "#0070f3", fontSize: "0.875rem" }}>
                    Ver
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay propiedades cargadas.</p>
          {canMutate && (
            <p style={{ marginTop: "0.5rem" }}>
              <Link href="/dashboard/properties/new" style={{ color: "#0070f3" }}>
                Crear la primera
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
