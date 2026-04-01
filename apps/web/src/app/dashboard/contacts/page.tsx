import { requireAuth } from "@/lib/server-utils";
import {
  COMMERCIAL_STAGES,
  CONVERSATIONAL_STAGES,
} from "@/domains/crm-leads/contact-stage-constants";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import type { Prisma } from "@kite-prospect/db";

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_Q_LEN = 200;

function parseParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export default async function ContactsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const searchParams = (await props.searchParams) ?? {};

  const qRaw = parseParam(searchParams.q);
  const commercialParam = parseParam(searchParams.commercial);
  const convParam = parseParam(searchParams.conv);
  const pageRaw = parseParam(searchParams.page);
  const pageSizeRaw = parseParam(searchParams.pageSize);

  const q = (qRaw ?? "").trim().slice(0, MAX_Q_LEN);

  const commercialFilter =
    commercialParam && commercialParam !== "all" && COMMERCIAL_STAGES.includes(commercialParam as (typeof COMMERCIAL_STAGES)[number])
      ? commercialParam
      : "all";

  const convFilter =
    convParam && convParam !== "all" && CONVERSATIONAL_STAGES.includes(convParam as (typeof CONVERSATIONAL_STAGES)[number])
      ? convParam
      : "all";

  let page = parseInt(pageRaw ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let pageSize = parseInt(pageSizeRaw ?? String(DEFAULT_PAGE_SIZE), 10);
  if (!Number.isFinite(pageSize)) pageSize = DEFAULT_PAGE_SIZE;
  pageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, pageSize));

  const baseWhere: Prisma.ContactWhereInput = {
    accountId,
    ...(commercialFilter !== "all" ? { commercialStage: commercialFilter } : {}),
    ...(convFilter !== "all" ? { conversationalStage: convFilter } : {}),
  };

  const where: Prisma.ContactWhereInput =
    q.length > 0
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : baseWhere;

  const total = await prisma.contact.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: {
          conversations: true,
          tasks: true,
          notes: true,
          assignments: true,
        },
      },
      assignments: {
        where: { status: "active" },
        include: {
          advisor: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  const commonQs = {
    q: q || undefined,
    commercial: commercialFilter === "all" ? undefined : commercialFilter,
    conv: convFilter === "all" ? undefined : convFilter,
    pageSize: pageSize === DEFAULT_PAGE_SIZE ? undefined : String(pageSize),
  };

  const prevHref =
    page > 1
      ? `/dashboard/contacts${buildQueryString({ ...commonQs, page: String(page - 1) })}`
      : null;
  const nextHref =
    page < totalPages
      ? `/dashboard/contacts${buildQueryString({ ...commonQs, page: String(page + 1) })}`
      : null;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Contactos</h1>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          {total === 0
            ? "Sin resultados para los filtros actuales."
            : `Mostrando ${contacts.length} de ${total} contacto(s) (página ${page} de ${totalPages}).`}
        </p>
      </header>

      <form method="get" style={{ marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666", flex: "1 1 220px" }}>
          Buscar
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={MAX_Q_LEN}
            placeholder="Nombre, email o teléfono"
            style={{ padding: "0.45rem", minWidth: "200px" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Etapa comercial
          <select name="commercial" defaultValue={commercialFilter} style={{ padding: "0.4rem", minWidth: "170px" }}>
            <option value="all">Todas</option>
            {COMMERCIAL_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Etapa conversacional
          <select name="conv" defaultValue={convFilter} style={{ padding: "0.4rem", minWidth: "190px" }}>
            <option value="all">Todas</option>
            {CONVERSATIONAL_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Por página
          <select name="pageSize" defaultValue={String(pageSize)} style={{ padding: "0.4rem", minWidth: "100px" }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="submit" style={{ padding: "0.45rem 0.8rem", cursor: "pointer" }}>
            Aplicar
          </button>
          <Link href="/dashboard/contacts" style={{ fontSize: "0.85rem", color: "#0070f3" }}>
            Limpiar
          </Link>
        </div>
      </form>

      {total > 0 && (
        <div style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", fontSize: "0.875rem" }}>
          {prevHref ? (
            <Link href={prevHref} style={{ color: "#0070f3" }}>
              ← Anterior
            </Link>
          ) : (
            <span style={{ color: "#ccc" }}>← Anterior</span>
          )}
          <span style={{ color: "#666" }}>
            Página {page} / {totalPages}
          </span>
          {nextHref ? (
            <Link href={nextHref} style={{ color: "#0070f3" }}>
              Siguiente →
            </Link>
          ) : (
            <span style={{ color: "#ccc" }}>Siguiente →</span>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/dashboard/contacts/${contact.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                padding: "1.5rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>{contact.name || contact.email || contact.phone || "Sin nombre"}</h3>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                  {contact.email && <span>📧 {contact.email}</span>}
                  {contact.phone && <span>📱 {contact.phone}</span>}
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666" }}>
                  <span>Conversación: {contact.conversationalStage}</span>
                  <span>Comercial: {contact.commercialStage}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
                  <span>💬 {contact._count.conversations}</span>
                  <span>✓ {contact._count.tasks}</span>
                  <span>📝 {contact._count.notes}</span>
                  {contact.assignments[0] && (
                    <span>👤 {contact.assignments[0].advisor.name}</span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.875rem", color: "#666" }}>
                  {contact.commercialStage === "hot" ? "🔥" : contact.commercialStage === "won" ? "✅" : "⚪"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {contacts.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay contactos con estos criterios.</p>
        </div>
      )}
    </div>
  );
}
