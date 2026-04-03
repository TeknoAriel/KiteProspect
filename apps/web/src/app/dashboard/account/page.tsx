import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import { getPublicAppBaseUrl } from "@/lib/public-base-url";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { HOSTING_ENV_ROWS, MVP_MODULES } from "./settings-hub-data";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      style={{
        marginTop: "2rem",
        padding: "1.25rem",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        scrollMarginTop: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function AccountSettingsHubPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const [account, baseUrl, planCount] = await Promise.all([
    prisma.account.findFirst({
      where: { id: session.user.accountId },
      select: {
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    }),
    getPublicAppBaseUrl(),
    prisma.followUpPlan.count({ where: { accountId: session.user.accountId } }),
  ]);

  if (!account) {
    redirect("/dashboard");
  }

  const slug = account.slug;

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "920px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Dashboard
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Centro de configuración</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", maxWidth: "42rem", lineHeight: 1.5 }}>
        Panel único para ver <strong>módulos del MVP</strong>, <strong>qué variables pedir en Vercel</strong>,{" "}
        <strong>endpoints</strong> y enlaces a <strong>asistente IA</strong> y <strong>planes de seguimiento</strong>. Los
        secretos <strong>nunca</strong> se muestran en pantalla: solo se configuran en el hosting.
      </p>

      <nav
        style={{
          marginTop: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1rem",
          fontSize: "0.85rem",
        }}
      >
        <a href="#modulos" style={{ color: "#0070f3" }}>
          Módulos
        </a>
        <a href="#conexion" style={{ color: "#0070f3" }}>
          Conexión (Vercel)
        </a>
        <a href="#integracion" style={{ color: "#0070f3" }}>
          Integración (slug)
        </a>
        <a href="#endpoints" style={{ color: "#0070f3" }}>
          Endpoints
        </a>
        <a href="#asistente" style={{ color: "#0070f3" }}>
          Asistente IA
        </a>
        <a href="#seguimientos" style={{ color: "#0070f3" }}>
          Seguimientos
        </a>
        <a href="#ajustes" style={{ color: "#0070f3" }}>
          Ajustes cuenta
        </a>
        <a href="#inventario-feeds" style={{ color: "#0070f3" }}>
          Inventario (feeds)
        </a>
      </nav>

      <Section id="modulos" title="Módulos del MVP (estado en producto)">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          Lista alineada al código actual. “Dónde” es la ruta o el concepto para probar.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.875rem", lineHeight: 1.55 }}>
          {MVP_MODULES.map((m) => (
            <li key={m.name} style={{ marginBottom: "0.35rem" }}>
              <span style={{ color: m.done ? "#0a0" : "#999" }}>{m.done ? "✓" : "○"}</span> {m.name}
              <span style={{ color: "#666" }}> — {m.where}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="conexion" title="Datos de conexión (entorno del servidor)">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          Configurá cada variable en <strong>Vercel → Settings → Environment Variables</strong> (o <code>.env</code>{" "}
          local). Valores sensibles no se leen desde esta app.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "0.4rem" }}>Variable</th>
                <th style={{ padding: "0.4rem" }}>Para qué</th>
                <th style={{ padding: "0.4rem" }}>Doc</th>
              </tr>
            </thead>
            <tbody>
              {HOSTING_ENV_ROWS.map((row) => (
                <tr key={row.key} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.45rem", fontFamily: "monospace", whiteSpace: "nowrap" }}>{row.key}</td>
                  <td style={{ padding: "0.45rem", color: "#444" }}>{row.purpose}</td>
                  <td style={{ padding: "0.45rem" }}>
                    {row.doc ? (
                      <span style={{ color: "#666" }}>
                        <code>{row.doc}</code>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: 0 }}>
          Guía humana: <code>docs/manual-actions-required.md</code>, <code>docs/paso-a-paso-vercel-kiteprospect.md</code>
          .
        </p>
      </Section>

      <Section id="integracion" title="Identidad del tenant para integraciones">
        <dl style={{ margin: 0, fontSize: "0.875rem", display: "grid", gap: "0.6rem" }}>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Slug (login y captura)</dt>
            <dd style={{ margin: 0 }}>
              <code>{slug}</code>
            </dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Nombre comercial</dt>
            <dd style={{ margin: 0 }}>{account.name}</dd>
          </div>
        </dl>
        <p style={{ fontSize: "0.85rem", color: "#555" }}>
          En <code>POST /api/contacts/create</code> usá <code>accountSlug</code>:{" "}
          <code>&quot;{slug}&quot;</code> y el header <code>Authorization: Bearer …</code> con el valor de{" "}
          <code>CAPTURE_API_SECRET</code> del entorno (no de la UI).
        </p>
      </Section>

      <Section id="endpoints" title="Endpoints y URLs base">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          Base detectada para esta sesión: <code>{baseUrl}</code> (mejor definir <code>AUTH_URL</code> en producción).
        </p>
        <ul style={{ fontSize: "0.82rem", lineHeight: 1.6, paddingLeft: "1.1rem" }}>
          <li>
            <strong>Leads (público con secreto):</strong> <code>POST {baseUrl}/api/contacts/create</code> — Bearer{" "}
            <code>CAPTURE_API_SECRET</code>. Ver <code>docs/capture-integration.md</code>.
          </li>
          <li>
            <strong>Formulario propio:</strong> <code>{baseUrl}/lead</code> o <code>{baseUrl}/lead?slug={slug}</code> (si{" "}
            <code>ENABLE_PUBLIC_LEAD_FORM=true</code>).
          </li>
          <li>
            <strong>Widget:</strong> script <code>{baseUrl}/kite-lead-widget.js</code> con{" "}
            <code>data-account-slug=&quot;{slug}&quot;</code>.
          </li>
          <li>
            <strong>Propiedades:</strong> no hay API REST pública por API key en Fase 1. El ABM es la app autenticada:{" "}
            <Link href="/dashboard/properties" style={{ color: "#0070f3" }}>
              /dashboard/properties
            </Link>{" "}
            y rutas <code>/api/properties</code> con <strong>sesión</strong> de usuario (cookies).
          </li>
          <li>
            <strong>IA siguiente acción (interno):</strong> <code>POST {baseUrl}/api/ai/conversation/next-action</code>{" "}
            — rol admin/coordinator.
          </li>
          <li>
            <strong>WhatsApp webhook (Meta):</strong> <code>{baseUrl}/api/webhooks/whatsapp</code>
          </li>
          <li>
            <strong>WhatsApp envío manual (interno):</strong> <code>POST {baseUrl}/api/whatsapp/send</code>
          </li>
          <li>
            <strong>Cron seguimientos:</strong> <code>GET {baseUrl}/api/cron/follow-up-due</code> —{" "}
            <code>Authorization: Bearer CRON_SECRET</code> o cabecera de Vercel Cron.
          </li>
          <li>
            <strong>Cron inventario KiteProp:</strong> <code>GET {baseUrl}/api/cron/kiteprop-property-feed</code> — misma
            auth; en <code>vercel.json</code> está <strong>cada ~2 días</strong> (02:00 UTC, días impares del mes; ajustar
            en pruebas). Ver <code>docs/decisions/slice-s32-kiteprop-incremental-json-cron.md</code>. Sync manual desde
            property-feeds si hace falta antes.
          </li>
        </ul>
      </Section>

      <Section id="asistente" title="Idioma y tipo de asistente (IA conversacional)">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          No hay un módulo separado de “idioma del producto”: el tono y reglas del asistente viven en el{" "}
          <strong>prompt del modelo</strong> (versión en código + overrides por cuenta). El proveedor (OpenAI / Gemini)
          se elige con variables de entorno — ver <code>.env.example</code> y{" "}
          <code>docs/decisions/slice-s10-conversational-ai.md</code>.
        </p>
        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.25rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard/account/ai-prompt" style={{ color: "#0070f3" }}>
              IA conversacional (prompt y texto adicional por cuenta)
            </Link>
          </li>
          <li>
            <Link href="/dashboard/inbox" style={{ color: "#0070f3" }}>
              Inbox → abrir un hilo
            </Link>{" "}
            para probar sugerencias y borrador WhatsApp.
          </li>
        </ul>
      </Section>

      <Section id="seguimientos" title="Lógica de seguimientos">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          Los <strong>planes</strong> definen la secuencia JSON (pasos, canal, demoras). El cron ejecuta intentos
          vencidos. Operación diaria:{" "}
          <Link href="/dashboard/followups" style={{ color: "#0070f3" }}>
            Seguimiento
          </Link>
          . Edición de planes (admin):
        </p>
        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.25rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard/account/follow-up-plans" style={{ color: "#0070f3" }}>
              Planes de seguimiento ({planCount} en esta cuenta)
            </Link>
          </li>
        </ul>
        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: 0 }}>
          Alta de planes nuevos solo por seed o futura UI — hoy podés editar los existentes.
        </p>
      </Section>

      <Section id="inventario-feeds" title="Inventario: feeds KiteProp (XML + JSON)">
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
          URLs del export OpenNavent / Proppit y opción de baja automática cuando el aviso ya no viene en el snapshot.
        </p>
        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.25rem", margin: 0 }}>
          <li>
            <Link href="/dashboard/account/property-feeds" style={{ color: "#0070f3" }}>
              Configurar feeds de propiedades
            </Link>
          </li>
        </ul>
      </Section>

      <Section id="ajustes" title="Ajustes persistidos en cuenta">
        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.25rem", margin: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard/account/general" style={{ color: "#0070f3" }}>
              Ajustes generales
            </Link>{" "}
            — nombre y zona horaria (S17).
          </li>
          <li>
            <Link href="/dashboard/account/ai-prompt" style={{ color: "#0070f3" }}>
              IA conversacional
            </Link>{" "}
            — overrides en <code>Account.config</code> (S12).
          </li>
        </ul>
        <dl
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            display: "grid",
            gap: "0.5rem",
            borderTop: "1px solid #eee",
            paddingTop: "1rem",
          }}
        >
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Estado cuenta</dt>
            <dd style={{ margin: 0 }}>{account.status}</dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Última actualización (registro)</dt>
            <dd style={{ margin: 0 }}>{account.updatedAt.toLocaleString()}</dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}
