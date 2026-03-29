import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  const accountId = session.user.accountId;

  // Stats básicos para dashboard
  const [contactsCount, conversationsCount, propertiesCount] = await Promise.all([
    prisma.contact.count({ where: { accountId } }),
    prisma.conversation.count({ where: { accountId } }),
    prisma.property.count({ where: { accountId } }),
  ]);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: "#666" }}>Cuenta: {session.user.accountSlug}</p>
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
          <Link href="/dashboard/properties" style={{ textDecoration: "none", color: "#0070f3" }}>
            Propiedades
          </Link>
          {session.user.role === "admin" && (
            <>
              <Link href="/dashboard/audit" style={{ textDecoration: "none", color: "#0070f3" }}>
                Auditoría
              </Link>
              <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
                Cuenta
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
        </nav>
      </header>

      <p style={{ color: "#555", fontSize: "0.9rem", maxWidth: "52rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
        Esta pantalla solo resume <strong>cantidades</strong>. Cada sprint suma funciones en <strong>otras rutas</strong> (inbox,
        fichas de contacto, inventario, etc.). Si los números siguen en 1 con datos demo, es normal; el progreso se ve al
        entrar a cada módulo.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
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
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{contactsCount}</p>
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
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "#666" }}>Conversaciones</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{conversationsCount}</p>
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
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{propertiesCount}</p>
        </Link>
      </div>

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
            — ABM de inventario (base del matching).
          </li>
          <li>
            <Link href="/dashboard/followups" style={{ color: "#0070f3" }}>
              Seguimiento
            </Link>{" "}
            — planes y secuencias; el cron de ejecución es servidor (Vercel).
          </li>
          {session.user.role === "admin" && (
            <>
              <li>
                <Link href="/dashboard/account" style={{ color: "#0070f3" }}>
                  Cuenta
                </Link>{" "}
                — nombre, zona horaria, prompt IA.
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
          <strong>Producción parece “atrasada”:</strong> en Vercel revisá que el último deployment sea de la rama{" "}
          <code style={{ fontSize: "0.8rem" }}>main</code> y estado <strong>Ready</strong>. La URL correcta es la de{" "}
          <strong>Domains</strong> en el proyecto (no mezclar con otro preview o otro repo).
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong>Lista de sprints en el repo:</strong> archivo <code style={{ fontSize: "0.8rem" }}>docs/execution-plan-sprints.md</code>{" "}
          (desarrolladores).
        </p>
      </div>
    </div>
  );
}
