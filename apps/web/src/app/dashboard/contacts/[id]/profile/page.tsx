import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      accountId,
    },
    include: {
      searchProfiles: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  const latestProfile = contact.searchProfiles[0];

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href={`/dashboard/contacts/${id}`} style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver a contacto
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Perfil de búsqueda</h1>
      </header>

      {latestProfile ? (
        <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
          <h2 style={{ marginTop: 0 }}>Perfil actual</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Intención
              </label>
              <p style={{ margin: 0 }}>{latestProfile.intent || "No especificado"}</p>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Tipo de propiedad
              </label>
              <p style={{ margin: 0 }}>{latestProfile.propertyType || "No especificado"}</p>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Zona
              </label>
              <p style={{ margin: 0 }}>{latestProfile.zone || "No especificado"}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Precio mínimo
                </label>
                <p style={{ margin: 0 }}>
                  {latestProfile.minPrice ? `$${latestProfile.minPrice.toLocaleString()}` : "No especificado"}
                </p>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Precio máximo
                </label>
                <p style={{ margin: 0 }}>
                  {latestProfile.maxPrice ? `$${latestProfile.maxPrice.toLocaleString()}` : "No especificado"}
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Dormitorios
                </label>
                <p style={{ margin: 0 }}>{latestProfile.bedrooms || "No especificado"}</p>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Baños
                </label>
                <p style={{ margin: 0 }}>{latestProfile.bathrooms || "No especificado"}</p>
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Fuente
              </label>
              <p style={{ margin: 0 }}>
                {latestProfile.source === "declared" ? "Declarado por el contacto" : "Inferido por IA"}
                {latestProfile.confidence && latestProfile.source === "inferred" && (
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {" "}(confianza: {(latestProfile.confidence * 100).toFixed(0)}%)
                  </span>
                )}
              </p>
            </div>
            {latestProfile.extra && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Requisitos adicionales
                </label>
                <pre style={{ margin: 0, padding: "0.5rem", backgroundColor: "#f9f9f9", borderRadius: "4px", fontSize: "0.875rem" }}>
                  {JSON.stringify(latestProfile.extra, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>Este contacto aún no tiene un perfil de búsqueda.</p>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Vista de lectura. Edición del perfil en Fase 2.
        </p>
      </div>
    </div>
  );
}
