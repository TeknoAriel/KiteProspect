import { selectPreferredSearchProfile } from "@/domains/crm-leads/search-profile-preference";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeclaredProfileForm } from "../declared-profile-form";
import { InferProfileButton } from "./infer-profile-button";

function searchProfileToFormInitial(sp: {
  intent: string | null;
  propertyType: string | null;
  zone: string | null;
  minPrice: unknown;
  maxPrice: unknown;
  bedrooms: number | null;
  bathrooms: number | null;
  extra: unknown;
}) {
  let extraJson = "";
  let excludedCsv = "";
  if (sp.extra !== null && sp.extra !== undefined && typeof sp.extra === "object" && !Array.isArray(sp.extra)) {
    const ex = sp.extra as Record<string, unknown>;
    const ids = ex.excludedPropertyIds;
    if (Array.isArray(ids)) {
      excludedCsv = ids.filter((x): x is string => typeof x === "string").join(", ");
    }
    const { excludedPropertyIds: _e, ...rest } = ex;
    if (Object.keys(rest).length > 0) {
      extraJson = JSON.stringify(rest, null, 2);
    }
  }

  return {
    intent: sp.intent ?? "",
    propertyType: sp.propertyType ?? "",
    zone: sp.zone ?? "",
    minPrice: sp.minPrice != null ? String(Number(sp.minPrice)) : "",
    maxPrice: sp.maxPrice != null ? String(Number(sp.maxPrice)) : "",
    bedrooms: sp.bedrooms != null ? String(sp.bedrooms) : "",
    bathrooms: sp.bathrooms != null ? String(sp.bathrooms) : "",
    excludedPropertyIds: excludedCsv,
    extraJson,
  };
}

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

  const preferredProfile = selectPreferredSearchProfile(contact.searchProfiles);
  const inferredLatest = contact.searchProfiles
    .filter((p) => p.source === "inferred")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  const declaredProfile =
    contact.searchProfiles.find((p) => p.source === "declared") ?? null;

  const formInitial = declaredProfile
    ? searchProfileToFormInitial(declaredProfile)
    : {
        intent: "",
        propertyType: "",
        zone: "",
        minPrice: "",
        maxPrice: "",
        bedrooms: "",
        bathrooms: "",
        excludedPropertyIds: "",
        extraJson: "",
      };

  const formKey = declaredProfile
    ? `${declaredProfile.id}-${declaredProfile.updatedAt.toISOString()}`
    : "new-declared";

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href={`/dashboard/contacts/${id}`} style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver a contacto
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Perfil de búsqueda</h1>
      </header>

      <InferProfileButton contactId={id} />

      {preferredProfile ? (
        <div
          style={{
            padding: "1.25rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            backgroundColor: "#fafafa",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Perfil usado en matching y scoring</h2>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#666" }}>
            Fuente:{" "}
            {preferredProfile.source === "declared"
              ? "Declarado por el equipo (prioridad sobre inferido)"
              : "Inferido (reglas / sistema)"}
            {preferredProfile.source === "inferred" && preferredProfile.confidence != null && (
              <span> — confianza ~{(Number(preferredProfile.confidence) * 100).toFixed(0)}%</span>
            )}
          </p>
          <ProfileReadOnly profile={preferredProfile} />
        </div>
      ) : (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Aún no hay perfil de búsqueda. Inferí desde mensajes o completá el formulario declarado.
        </p>
      )}

      {inferredLatest && preferredProfile?.id !== inferredLatest.id ? (
        <div
          style={{
            padding: "1.25rem",
            border: "1px dashed #ccc",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Último perfil inferido (no prioriza sobre el declarado)</h2>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#666" }}>
            Confianza ~{(Number(inferredLatest.confidence ?? 0) * 100).toFixed(0)}%
          </p>
          <ProfileReadOnly profile={inferredLatest} />
        </div>
      ) : null}

      <DeclaredProfileForm key={formKey} contactId={id} initial={formInitial} />

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          El motor de IA en inbox usa el JSON <code>Contact.declaredProfile</code> al guardar el formulario declarado. Si
          solo hay perfil inferido, el contexto de conversación sigue basándose en mensajes y datos de contacto.
        </p>
      </div>
    </div>
  );
}

function ProfileReadOnly({
  profile,
}: {
  profile: {
    intent: string | null;
    propertyType: string | null;
    zone: string | null;
    minPrice: unknown;
    maxPrice: unknown;
    bedrooms: number | null;
    bathrooms: number | null;
    extra: unknown;
  };
}) {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div>
        <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Intención</span>
        <p style={{ margin: "0.15rem 0 0" }}>{profile.intent || "—"}</p>
      </div>
      <div>
        <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Tipo</span>
        <p style={{ margin: "0.15rem 0 0" }}>{profile.propertyType || "—"}</p>
      </div>
      <div>
        <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Zona</span>
        <p style={{ margin: "0.15rem 0 0" }}>{profile.zone || "—"}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Precio min / max</span>
          <p style={{ margin: "0.15rem 0 0" }}>
            {profile.minPrice != null ? `$${Number(profile.minPrice).toLocaleString()}` : "—"} —{" "}
            {profile.maxPrice != null ? `$${Number(profile.maxPrice).toLocaleString()}` : "—"}
          </p>
        </div>
        <div>
          <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Dorm. / baños</span>
          <p style={{ margin: "0.15rem 0 0" }}>
            {profile.bedrooms ?? "—"} / {profile.bathrooms ?? "—"}
          </p>
        </div>
      </div>
      {profile.extra != null && (
        <div>
          <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Extra</span>
          <pre
            style={{
              margin: "0.25rem 0 0",
              padding: "0.5rem",
              backgroundColor: "#fff",
              borderRadius: "4px",
              fontSize: "0.8rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(profile.extra, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
