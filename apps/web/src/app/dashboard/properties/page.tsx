import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { serializeProperty } from "@/domains/properties/property-serialization";
import { PROPERTY_STATUSES } from "@/domains/properties/validate-property-payload";
import type { Prisma } from "@kite-prospect/db";

const CAN_MUTATE = new Set(["admin", "coordinator"]);
const MAX_Q_LEN = 120;

function parseParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PropertiesListPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const canMutate = session.user.role ? CAN_MUTATE.has(session.user.role) : false;
  const searchParams = (await props.searchParams) ?? {};

  const qRaw = parseParam(searchParams.q);
  const statusRaw = parseParam(searchParams.status);
  const sourceRaw = parseParam(searchParams.source);

  const q = (qRaw ?? "").trim().slice(0, MAX_Q_LEN);

  const statusFilter =
    statusRaw &&
    statusRaw !== "all" &&
    PROPERTY_STATUSES.includes(statusRaw as (typeof PROPERTY_STATUSES)[number])
      ? statusRaw
      : "all";

  const sourceFilter =
    sourceRaw === "kiteprop" || sourceRaw === "manual" ? sourceRaw : "all";

  const sourceWhere: Prisma.PropertyWhereInput =
    sourceFilter === "kiteprop"
      ? { externalSource: "kiteprop" }
      : sourceFilter === "manual"
        ? {
            OR: [{ externalSource: null }, { externalSource: { not: "kiteprop" } }],
          }
        : {};

  const where: Prisma.PropertyWhereInput = {
    accountId,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...sourceWhere,
    ...(q.length > 0
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { zone: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { externalId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.property.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (statusFilter !== "all") qs.set("status", statusFilter);
  if (sourceFilter !== "all") qs.set("source", sourceFilter);
  const qsStr = qs.toString();

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
            ← Volver
          </Link>
          <h1 style={{ marginTop: "1rem" }}>Propiedades</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Inventario del tenant (F1-E4). Filtrá por estado, origen y texto. Matching usa solo filas reales.
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

      <form
        method="get"
        action="/dashboard/properties"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
          alignItems: "flex-end",
          marginBottom: "1.25rem",
          padding: "1rem",
          background: "#f8f9fb",
          borderRadius: 10,
          border: "1px solid #e8e8e8",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label htmlFor="prop-q" style={{ display: "block", fontSize: "0.75rem", color: "#555", marginBottom: 4 }}>
            Buscar
          </label>
          <input
            id="prop-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Título, zona, dirección, id externo…"
            style={{ width: "100%", padding: "0.45rem 0.5rem", fontSize: "0.875rem", borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>
        <div>
          <label htmlFor="prop-status" style={{ display: "block", fontSize: "0.75rem", color: "#555", marginBottom: 4 }}>
            Estado
          </label>
          <select
            id="prop-status"
            name="status"
            defaultValue={statusFilter}
            style={{ padding: "0.45rem 0.5rem", fontSize: "0.875rem", borderRadius: 6, border: "1px solid #ccc", minWidth: 140 }}
          >
            <option value="all">Todos</option>
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prop-source" style={{ display: "block", fontSize: "0.75rem", color: "#555", marginBottom: 4 }}>
            Origen
          </label>
          <select
            id="prop-source"
            name="source"
            defaultValue={sourceFilter}
            style={{ padding: "0.45rem 0.5rem", fontSize: "0.875rem", borderRadius: 6, border: "1px solid #ccc", minWidth: 160 }}
          >
            <option value="all">Todos</option>
            <option value="manual">Manual / otras fuentes</option>
            <option value="kiteprop">Feed KiteProp</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Aplicar
        </button>
        {qsStr ? (
          <Link href="/dashboard/properties" style={{ fontSize: "0.85rem", color: "#666", paddingBottom: 6 }}>
            Limpiar filtros
          </Link>
        ) : null}
      </form>

      <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
        Mostrando <strong>{rows.length}</strong>
        {rows.length >= 200 ? "+" : ""} resultado{rows.length !== 1 ? "s" : ""}
        {qsStr ? (
          <>
            {" "}
            · <Link href={`/dashboard/properties?${qsStr}`} style={{ color: "#0070f3" }}>
              compartir esta búsqueda
            </Link>
          </>
        ) : null}
      </p>

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
                  {s.externalSource === "kiteprop" && (
                    <span style={{ color: "#555" }}>
                      Origen feed · id {s.externalId}
                      {s.currency ? ` · ${s.currency}` : ""}
                    </span>
                  )}
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
          <p>No hay propiedades con estos filtros.</p>
          {qsStr ? (
            <p style={{ marginTop: "0.5rem" }}>
              <Link href="/dashboard/properties" style={{ color: "#0070f3" }}>
                Quitar filtros
              </Link>
            </p>
          ) : null}
          {canMutate && !qsStr && (
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
