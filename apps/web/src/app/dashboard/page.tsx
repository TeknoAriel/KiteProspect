import {
  DashboardChannelChips,
  DashboardContactsTrend,
  DashboardPipelineBars,
  DashboardRecentContacts,
} from "./dashboard-panels";
import { getDashboardKpisForAccount } from "@/domains/analytics/get-dashboard-kpis";
import { requireAuth } from "@/lib/server-utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  const kpis = await getDashboardKpisForAccount(accountId, { session });

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Operaciones</h1>
          <p style={{ color: "#666", margin: 0, fontSize: "0.9rem" }}>
            Vista rápida del tenant <strong>{session.user.accountSlug}</strong> — embudo, canales y actividad reciente.
          </p>
          {session.user.role === "advisor" && (
            <p style={{ color: "#8a5a00", margin: "0.5rem 0 0", fontSize: "0.82rem", maxWidth: "36rem" }}>
              Como <strong>asesor</strong> no ves el import KiteProp ni la validación de borradores; usá{" "}
              <code style={{ fontSize: "0.78rem" }}>admin@demo.local</code> o un usuario coordinator para esas pantallas.
            </p>
          )}
        </div>
        <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/dashboard/inbox" style={{ textDecoration: "none", color: "#0070f3" }}>
            Inbox
          </Link>
          <Link href="/dashboard/contacts" style={{ textDecoration: "none", color: "#0070f3" }}>
            Contactos
          </Link>
          <Link href="/dashboard/followups" style={{ textDecoration: "none", color: "#0070f3" }}>
            Seguimiento
          </Link>
          <Link href="/dashboard/reportes" style={{ textDecoration: "none", color: "#0070f3" }}>
            Reportes
          </Link>
          {(session.user.role === "admin" || session.user.role === "coordinator") && (
            <Link href="/dashboard/validation-inbox" style={{ textDecoration: "none", color: "#0070f3", fontWeight: 600 }}>
              Validación KiteProp
            </Link>
          )}
          <Link href="/dashboard/properties" style={{ textDecoration: "none", color: "#0070f3" }}>
            Propiedades
          </Link>
          {session.user.role === "admin" && (
            <>
              <Link href="/dashboard/audit" style={{ textDecoration: "none", color: "#0070f3" }}>
                Auditoría
              </Link>
              <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
                Configuración
              </Link>
            </>
          )}
          <Link href="/dashboard/accounts" style={{ textDecoration: "none", color: "#0070f3" }}>
            Cuentas
          </Link>
          <Link href="/dashboard/users" style={{ textDecoration: "none", color: "#0070f3" }}>
            Usuarios
          </Link>
          <Link href="/dashboard/advisors" style={{ textDecoration: "none", color: "#0070f3" }}>
            Asesores
          </Link>
          {(session.user.role === "admin" || session.user.role === "coordinator") && (
            <>
              <Link href="/dashboard/demo-channels" style={{ textDecoration: "none", color: "#0070f3" }}>
                Demo canales
              </Link>
              <Link href="/dashboard/demo-simulation" style={{ textDecoration: "none", color: "#0070f3" }}>
                Lab 20 escenarios
              </Link>
            </>
          )}
        </nav>
      </header>

      <p style={{ color: "#555", fontSize: "0.9rem", maxWidth: "52rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
        Esta pantalla resume <strong>cantidades</strong>. Tras <code style={{ fontSize: "0.85rem" }}>npm run db:seed</code>{" "}
        la cuenta <code style={{ fontSize: "0.85rem" }}>demo</code> incluye contactos de ejemplo (emails{" "}
        <code style={{ fontSize: "0.85rem" }}>*@demo-showcase.local</code>) con distintos canales de entrada, mensajes de
        respuesta y planes de seguimiento por intensidad; ver inbox, contactos y seguimiento.         El recorrido guiado: <strong>Cerrar</strong> lo omite en esta sesión del navegador;{" "}
        <strong>No volver a mostrar</strong> guarda la preferencia en este dispositivo. Reabrilo con{" "}
        <strong>Cómo funciona Kite</strong> (abajo a la derecha).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link
          href="/dashboard/reportes"
          style={{
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
            background: "linear-gradient(135deg, #f8fbff 0%, #fff 100%)",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Reportes</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0070f3" }}>
            Ver resumen operativo →
          </p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "#666" }}>
            Canales, embudo conversacional, tareas y seguimientos
          </p>
        </Link>
        <Link
          href="/dashboard/contacts"
          style={{
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Contactos</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{kpis.contactsTotal}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#666" }}>
            Nuevos últimos {kpis.newContactsDays} días: <strong>{kpis.contactsNewInPeriod}</strong>
          </p>
        </Link>
        <Link
          href="/dashboard/inbox"
          style={{
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Conversaciones abiertas</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{kpis.conversationsOpen}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#666" }}>
            Total en cuenta: {kpis.conversationsTotal}
          </p>
        </Link>
        <Link
          href="/dashboard/properties"
          style={{
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Propiedades</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{kpis.propertiesTotal}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#666" }}>
            Disponibles (matching): <strong>{kpis.propertiesAvailable}</strong>
          </p>
        </Link>
        {(session.user.role === "admin" || session.user.role === "coordinator") && (
          <Link
            href="/dashboard/validation-inbox"
            style={{
              padding: "1.5rem",
              border: "2px solid #0070f3",
              borderRadius: "8px",
              textDecoration: "none",
              color: "inherit",
              display: "block",
              background: "linear-gradient(135deg, #f0f7ff 0%, #fff 100%)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#0070f3" }}>
              Import API KiteProp
            </h3>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0070f3" }}>
              Validación de borradores →
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "#555" }}>
              Revisar y enviar respuestas sugeridas (sin automatismo global si review mode está activo).
            </p>
          </Link>
        )}
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>Embudo y canales</h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "1rem", maxWidth: "48rem" }}>
          Barras proporcionales al máximo de la serie. Etapas según <code>commercialStage</code>; conversaciones agrupadas
          por <code>Conversation.channel</code> (primera interacción por hilo).
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "1.25rem",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>Pipeline comercial</h3>
            {kpis.commercialStageCounts.length > 0 ? (
              <DashboardPipelineBars rows={kpis.commercialStageCounts} />
            ) : (
              <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>Sin contactos con etapa aún.</p>
            )}
          </div>
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "1.25rem",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>Conversaciones por canal</h3>
            <DashboardChannelChips rows={kpis.channelCounts} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>Alta de contactos (14 días, UTC)</h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.5rem" }}>
          Un contacto nuevo por día (eje = día del mes en UTC).
        </p>
        <div
          style={{
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            padding: "1rem 1.25rem 0.5rem",
            background: "#fafbff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <DashboardContactsTrend days={kpis.newContactsByDay} />
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>Últimos contactos</h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0, marginBottom: "0.75rem" }}>
          Los {kpis.recentContacts.length} más recientes por fecha de creación.{" "}
          <Link href="/dashboard/contacts" style={{ color: "#0070f3" }}>
            Ver listado completo
          </Link>
          .
        </p>
        <DashboardRecentContacts contacts={kpis.recentContacts} />
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Dónde probar lo que ya está en el MVP</h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: "1.25rem",
            display: "grid",
            gap: "0.5rem",
            fontSize: "0.875rem",
            color: "#333",
            lineHeight: 1.45,
          }}
        >
          <li>
            <Link href="/dashboard/reportes" style={{ color: "#0070f3" }}>
              Reportes operativos
            </Link>{" "}
            — canales (nuevos 7 días), SLA primera respuesta, embudos conversacional y comercial, CSV.
          </li>
          <li>
            <Link href="/dashboard/inbox" style={{ color: "#0070f3" }}>
              Inbox
            </Link>{" "}
            — lista con filtros por canal/estado, búsqueda y paginación; abrí un hilo para IA + borrador WhatsApp.
          </li>
          <li>
            <Link href="/dashboard/contacts" style={{ color: "#0070f3" }}>
              Contactos
            </Link>{" "}
            → ficha: matching v0, recalcular,{" "}
            <strong>enviar recomendación por WhatsApp</strong> (admin/coordinator), perfil y score.
          </li>
          <li>
            <Link href="/dashboard/properties" style={{ color: "#0070f3" }}>
              Propiedades
            </Link>{" "}
            — ABM de inventario; filtros por texto, estado y origen (manual vs feed).
          </li>
          <li>
            <Link href="/dashboard/followups" style={{ color: "#0070f3" }}>
              Seguimiento
            </Link>{" "}
            — planes y secuencias; el cron de ejecución es servidor (Vercel).
          </li>
          {(session.user.role === "admin" || session.user.role === "coordinator") && (
            <li>
              <Link href="/dashboard/validation-inbox" style={{ color: "#0070f3" }}>
                Validación import KiteProp
              </Link>{" "}
              — leads desde API, borradores WhatsApp/email, aprobar y enviar uno a uno. Requiere variables{" "}
              <code style={{ fontSize: "0.8rem" }}>KITEPROP_API_*</code> y corrida{" "}
              <code style={{ fontSize: "0.8rem" }}>npm run kiteprop:import:last-week</code> o POST interno.
            </li>
          )}
          {(session.user.role === "admin" || session.user.role === "coordinator") && (
            <li>
              <Link href="/dashboard/demo-channels" style={{ color: "#0070f3" }}>
                Demo canales
              </Link>{" "}
              y{" "}
              <Link href="/dashboard/demo-simulation" style={{ color: "#0070f3" }}>
                Lab 20 escenarios
              </Link>{" "}
              — simulación sin Meta (admin/coordinator).
            </li>
          )}
          {session.user.role === "admin" && (
            <>
              <li>
                <Link href="/dashboard/account" style={{ color: "#0070f3" }}>
                  Configuración
                </Link>{" "}
                — módulos, Vercel, endpoints, IA, planes de seguimiento, ajustes generales,{" "}
                <Link href="/dashboard/account/property-feeds" style={{ color: "#0070f3" }}>
                  feeds de inventario KiteProp
                </Link>
                .
              </li>
              <li>
                <Link href="/dashboard/audit" style={{ color: "#0070f3" }}>
                  Auditoría
                </Link>{" "}
                — eventos registrados (envíos, matches, etc.).
              </li>
            </>
          )}
          <li>
            <Link href="/dashboard/users" style={{ color: "#0070f3" }}>
              Usuarios
            </Link>{" "}
            y{" "}
            <Link href="/dashboard/advisors" style={{ color: "#0070f3" }}>
              Asesores
            </Link>{" "}
            — ABM por tenant (roles admin/coordinator para mutaciones).
          </li>
        </ul>
      </section>

      <div style={{ padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>
          <strong>Deploy en Vercel:</strong> si ves funciones viejas en la URL pública, abrí el proyecto →{" "}
          <strong>Deployments</strong> y confirmá que el último sea de <code style={{ fontSize: "0.8rem" }}>main</code> en
          estado <strong>Ready</strong>. La URL canónica está en <strong>Settings → Domains</strong> (no confundir con
          preview de otra rama).
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>Lista de sprints en el repo:</strong> archivo <code style={{ fontSize: "0.8rem" }}>docs/execution-plan-sprints.md</code>{" "}
          (desarrolladores).
        </p>
      </div>
    </div>
  );
}
