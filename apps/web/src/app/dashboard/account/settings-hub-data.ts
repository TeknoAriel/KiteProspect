/** Listas estáticas para el centro de configuración (alineado al MVP en código). */

export const MVP_MODULES: { name: string; done: boolean; where: string }[] = [
  { name: "Multi-tenant y login por slug", done: true, where: "/login" },
  { name: "Captura: API + rate limit + auditoría", done: true, where: "Ver endpoints abajo" },
  { name: "Captura: formulario /lead y widget embed", done: true, where: "/lead, /embed/lead, public/kite-lead-widget.js" },
  { name: "Inbox: filtros, búsqueda, paginación, hilo + IA", done: true, where: "/dashboard/inbox" },
  { name: "CRM: contactos, ficha, matching, envío recomendación WA", done: true, where: "/dashboard/contacts" },
  { name: "Inventario propiedades (ABM)", done: true, where: "/dashboard/properties" },
  { name: "Usuarios y asesores (ABM)", done: true, where: "/dashboard/users, /dashboard/advisors" },
  { name: "Cuenta: nombre, timezone, prompt IA (asistente)", done: true, where: "Ajustes en este centro" },
  { name: "Seguimientos: cron + edición de planes (secuencia JSON)", done: true, where: "/dashboard/followups + Planes abajo" },
  { name: "WhatsApp: webhook + envío", done: true, where: "Variables Meta + endpoints abajo" },
  { name: "Auditoría", done: true, where: "/dashboard/audit" },
  { name: "API pública inventario/leads por API key por tenant", done: false, where: "Fase 2 (roadmap)" },
];

export type EnvRow = { key: string; purpose: string; doc?: string };

export const HOSTING_ENV_ROWS: EnvRow[] = [
  { key: "DATABASE_URL", purpose: "PostgreSQL (Neon u otro). En Vercel: Environment Variables.", doc: "docs/setup-local.md" },
  { key: "AUTH_SECRET", purpose: "Sesión NextAuth; obligatorio.", doc: "docs/manual-actions-required.md" },
  { key: "AUTH_URL", purpose: "URL pública exacta sin barra final (login y callbacks).", doc: "docs/configuracion-manual-paso-a-paso.md" },
  { key: "CAPTURE_API_SECRET", purpose: "Bearer para POST /api/contacts/create (landings/proxy).", doc: "docs/capture-integration.md" },
  { key: "ENABLE_PUBLIC_LEAD_FORM", purpose: "true para activar /lead y /embed/lead.", doc: "docs/capture-integration.md" },
  { key: "CRON_SECRET", purpose: "Bearer al invocar /api/cron/follow-up-due manualmente.", doc: "docs/decisions/slice-s07-follow-up-cron.md" },
  { key: "OPENAI_API_KEY / GEMINI_API_KEY", purpose: "Motor conversacional (ver AI_PROVIDER en .env.example).", doc: "docs/decisions/slice-s10-conversational-ai.md" },
  { key: "WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN", purpose: "Envío saliente Graph API.", doc: "docs/decisions/slice-s09-whatsapp-outbound.md" },
  { key: "WHATSAPP_VERIFY_TOKEN + WHATSAPP_ACCOUNT_SLUG (+ WHATSAPP_APP_SECRET)", purpose: "Webhook entrante.", doc: "docs/decisions/slice-s08-whatsapp-webhook.md" },
];
