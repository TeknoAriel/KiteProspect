import { requireAuth } from "@/lib/server-utils";
import { conversationWhereForAdvisorContact } from "@/domains/auth-tenancy/advisor-contact-scope";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import type { Prisma } from "@kite-prospect/db";

const CHANNEL_OPTIONS = [
  "all",
  "form",
  "web_widget",
  "landing",
  "whatsapp",
  "email",
  "sms",
  "meta_lead",
] as const;
const STATUS_OPTIONS = ["all", "active", "closed", "archived"] as const;

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_Q_LEN = 200;

function parseParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function buildInboxQueryString(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/** Fecha YYYY-MM-DD en UTC; inválida → null */
function parseYmdUtc(ymd: string | undefined): Date | null {
  const s = ymd?.trim();
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function endUtcDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

export default async function InboxPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const accountId = session.user.accountId;
  const searchParams = (await props.searchParams) ?? {};

  const channelParam = parseParam(searchParams.channel);
  const statusParam = parseParam(searchParams.status);
  const qRaw = parseParam(searchParams.q);
  const pageRaw = parseParam(searchParams.page);
  const pageSizeRaw = parseParam(searchParams.pageSize);
  const fromRaw = parseParam(searchParams.from);
  const toRaw = parseParam(searchParams.to);

  const channelFilter = CHANNEL_OPTIONS.includes(
    (channelParam ?? "all") as (typeof CHANNEL_OPTIONS)[number],
  )
    ? ((channelParam ?? "all") as (typeof CHANNEL_OPTIONS)[number])
    : "all";
  const statusFilter = STATUS_OPTIONS.includes(
    (statusParam ?? "active") as (typeof STATUS_OPTIONS)[number],
  )
    ? ((statusParam ?? "active") as (typeof STATUS_OPTIONS)[number])
    : "active";

  const q = (qRaw ?? "").trim().slice(0, MAX_Q_LEN);

  const fromDate = parseYmdUtc(fromRaw);
  const toDate = parseYmdUtc(toRaw);
  const updatedAtRange: { gte?: Date; lte?: Date } = {};
  if (fromDate) updatedAtRange.gte = fromDate;
  if (toDate) updatedAtRange.lte = endUtcDay(toDate);

  let page = parseInt(pageRaw ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let pageSize = parseInt(pageSizeRaw ?? String(DEFAULT_PAGE_SIZE), 10);
  if (!Number.isFinite(pageSize)) pageSize = DEFAULT_PAGE_SIZE;
  pageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, pageSize));

  const scope = conversationWhereForAdvisorContact(accountId, session);
  const filterBlock: Prisma.ConversationWhereInput = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(channelFilter !== "all" ? { channel: channelFilter } : {}),
    ...(Object.keys(updatedAtRange).length > 0 ? { updatedAt: updatedAtRange } : {}),
  };

  const where: Prisma.ConversationWhereInput =
    q.length > 0
      ? {
          AND: [
            scope,
            filterBlock,
            {
              OR: [
                {
                  contact: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { email: { contains: q, mode: "insensitive" } },
                      { phone: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
                {
                  messages: {
                    some: {
                      content: { contains: q, mode: "insensitive" },
                    },
                  },
                },
              ],
            },
          ],
        }
      : { AND: [scope, filterBlock] };

  const total = await prisma.conversation.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          conversationalStage: true,
          commercialStage: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  const conversationIds = conversations.map((c) => c.id);
  let lastInboundAtByConversation = new Map<string, Date>();
  if (conversationIds.length > 0) {
    const grouped = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        direction: "inbound",
      },
      _max: { createdAt: true },
    });
    for (const g of grouped) {
      if (g._max.createdAt) {
        lastInboundAtByConversation.set(g.conversationId, g._max.createdAt);
      }
    }
  }

  function isUnreadInbound(conv: (typeof conversations)[0]): boolean {
    const lastIn = lastInboundAtByConversation.get(conv.id);
    if (!lastIn) return false;
    if (!conv.lastReadAt) return true;
    return lastIn.getTime() > conv.lastReadAt.getTime();
  }

  const commonQs = {
    channel: channelFilter === "all" ? undefined : channelFilter,
    status: statusFilter === "active" && !statusParam ? undefined : statusFilter,
    q: q || undefined,
    pageSize: pageSize === DEFAULT_PAGE_SIZE ? undefined : String(pageSize),
  };

  const prevHref =
    page > 1
      ? `/dashboard/inbox${buildInboxQueryString({ ...commonQs, page: String(page - 1) })}`
      : null;
  const nextHref =
    page < totalPages
      ? `/dashboard/inbox${buildInboxQueryString({ ...commonQs, page: String(page + 1) })}`
      : null;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Volver
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Inbox</h1>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          {total === 0
            ? "Sin resultados para los filtros actuales."
            : `Mostrando ${conversations.length} de ${total} conversación(es) (página ${page} de ${totalPages}).`}{" "}
          Clic en la tarjeta para abrir el hilo y la asistencia IA.
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
            placeholder="Nombre, email, teléfono o texto en mensajes"
            style={{ padding: "0.45rem", minWidth: "200px" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Canal
          <select name="channel" defaultValue={channelFilter} style={{ padding: "0.4rem", minWidth: "170px" }}>
            <option value="all">Todos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="form">Formulario</option>
            <option value="web_widget">Widget</option>
            <option value="landing">Landing</option>
            <option value="meta_lead">Meta Lead</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Estado conversación
          <select name="status" defaultValue={statusFilter} style={{ padding: "0.4rem", minWidth: "170px" }}>
            <option value="all">Todos</option>
            <option value="active">active</option>
            <option value="closed">closed</option>
            <option value="archived">archived</option>
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
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Actualizado desde (UTC)
          <input
            type="date"
            name="from"
            defaultValue={fromRaw?.trim() ?? ""}
            style={{ padding: "0.4rem", minWidth: "140px" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
          Actualizado hasta (UTC)
          <input
            type="date"
            name="to"
            defaultValue={toRaw?.trim() ?? ""}
            style={{ padding: "0.4rem", minWidth: "140px" }}
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="submit" style={{ padding: "0.45rem 0.8rem", cursor: "pointer" }}>
            Aplicar
          </button>
          <Link href="/dashboard/inbox" style={{ fontSize: "0.85rem", color: "#0070f3" }}>
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
        {conversations.map((conv) => {
          const lastMessage = conv.messages[0];
          const contact = conv.contact;
          const unread = isUnreadInbound(conv);

          return (
            <div
              key={conv.id}
              style={{
                padding: "1.5rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: unread ? "inset 4px 0 0 #0070f3" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <Link
                prefetch={false}
                href={`/dashboard/inbox/${conv.id}`}
                style={{ textDecoration: "none", color: "inherit", flex: 1 }}
              >
                <div style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>
                      {contact.name || contact.email || contact.phone || "Sin nombre"}
                    </h3>
                    {unread && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.45rem",
                          backgroundColor: "#e8f0fe",
                          color: "#0b57d0",
                          borderRadius: "4px",
                        }}
                      >
                        No leído
                      </span>
                    )}
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                      {conv.channel}
                    </span>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: "#f5f5f5", borderRadius: "4px", color: "#666" }}>
                      {conv.status}
                    </span>
                  </div>
                  {lastMessage && (
                    <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
                      {lastMessage.content.substring(0, 150)}
                      {lastMessage.content.length > 150 ? "..." : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#666", flexWrap: "wrap" }}>
                    <span>💬 {conv._count.messages} mensajes</span>
                    <span>Estado: {contact.conversationalStage}</span>
                    <span>Comercial: {contact.commercialStage}</span>
                  </div>
                </div>
              </Link>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                <Link href={`/dashboard/contacts/${contact.id}`} style={{ color: "#0070f3", fontSize: "0.8rem" }}>
                  Ficha contacto
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No hay conversaciones para ese filtro o búsqueda.</p>
        </div>
      )}

      {total > 0 && (
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", fontSize: "0.875rem" }}>
          {prevHref ? (
            <Link href={prevHref} style={{ color: "#0070f3" }}>
              ← Anterior
            </Link>
          ) : (
            <span style={{ color: "#ccc" }}>← Anterior</span>
          )}
          {nextHref ? (
            <Link href={nextHref} style={{ color: "#0070f3" }}>
              Siguiente →
            </Link>
          ) : (
            <span style={{ color: "#ccc" }}>Siguiente →</span>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>MVP:</strong> Hilo por conversación + sugerencia IA y envío manual del borrador por
          WhatsApp (S12). Filtros por canal/estado (S18), búsqueda y paginación (S19), rango por{" "}
          <code>updatedAt</code> en UTC (S25). Indicador “No leído” si hay mensaje entrante posterior a{" "}
          <code>lastReadAt</code>; al abrir el hilo se marca lectura (S29).
        </p>
      </div>
    </div>
  );
}
