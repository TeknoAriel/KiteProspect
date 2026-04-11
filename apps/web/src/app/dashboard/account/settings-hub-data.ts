/** Listas estáticas para el centro de configuración (alineado al MVP en código). */

export const MVP_MODULES: { name: string; done: boolean; where: string }[] = [
  { name: "Multi-tenant y login por slug", done: true, where: "/login" },
  { name: "Captura: API + rate limit + auditoría", done: true, where: "Ver endpoints abajo" },
  { name: "Captura: formulario /lead y widget embed", done: true, where: "/lead, /embed/lead, public/kite-lead-widget.js" },
  { name: "Inbox: filtros, búsqueda, paginación, hilo + IA", done: true, where: "/dashboard/inbox" },
  { name: "CRM: contactos, ficha, matching, envío recomendación WA", done: true, where: "/dashboard/contacts" },
  { name: "Inventario propiedades (ABM)", done: true, where: "/dashboard/properties" },
  { name: "Inventario: feeds KiteProp (XML + JSON + cron)", done: true, where: "/dashboard/account/property-feeds" },
  { name: "Usuarios y asesores (ABM)", done: true, where: "/dashboard/users, /dashboard/advisors" },
  { name: "Cuenta: nombre, timezone, prompt IA (asistente)", done: true, where: "Ajustes en este centro" },
  { name: "Seguimientos: cron + edición de planes (secuencia JSON)", done: true, where: "/dashboard/followups + Planes abajo" },
  { name: "WhatsApp: webhook + envío", done: true, where: "Variables Meta + endpoints abajo" },
  { name: "Auditoría", done: true, where: "/dashboard/audit" },
  { name: "Integraciones Meta Lead Ads (pageId + estado)", done: true, where: "/dashboard/account/integrations" },
  { name: "OpenAPI captura pública (POST /api/contacts/create)", done: true, where: "/openapi-capture-v1.yaml" },
  { name: "API keys captura por tenant (Bearer kp_…)", done: true, where: "/dashboard/account/capture-api-keys" },
  { name: "Webhooks salientes firmados (F3-E3)", done: true, where: "/dashboard/account/webhooks" },
  {
    name: "Diagnóstico CRM externo (duplicados `externalId`)",
    done: true,
    where: "/dashboard/account/diagnostics/crm-external",
  },
  { name: "Sucursales por cuenta + filtro CRM (F3-E4 MVP)", done: true, where: "/dashboard/account/branches" },
  { name: "Seguimiento por SMS (Twilio, canal sms en plan)", done: true, where: "Variables Twilio + planes JSON" },
  { name: "Demo por canal (hilos simulados sin Meta/Resend/Twilio)", done: true, where: "/dashboard/demo-channels" },
  { name: "Laboratorio 20 escenarios (reporte IA + seguimiento)", done: true, where: "/dashboard/demo-simulation" },
  { name: "API pública inventario por API key por tenant", done: false, where: "Fase 3+ (roadmap)" },
];

export type EnvRow = { key: string; purpose: string; doc?: string };

export const HOSTING_ENV_ROWS: EnvRow[] = [
  { key: "DATABASE_URL", purpose: "PostgreSQL (Neon u otro). En Vercel: Environment Variables.", doc: "docs/setup-local.md" },
  { key: "AUTH_SECRET", purpose: "Sesión NextAuth; obligatorio.", doc: "docs/manual-actions-required.md" },
  { key: "AUTH_URL", purpose: "URL pública exacta sin barra final (login y callbacks).", doc: "docs/configuracion-manual-paso-a-paso.md" },
  {
    key: "CAPTURE_API_SECRET",
    purpose: "Opcional si hay API keys por cuenta: Bearer global para POST /api/contacts/create.",
    doc: "docs/capture-integration.md",
  },
  { key: "ENABLE_PUBLIC_LEAD_FORM", purpose: "true para activar /lead y /embed/lead.", doc: "docs/capture-integration.md" },
  {
    key: "CRON_SECRET",
    purpose: "Bearer al invocar crons (/api/cron/follow-up-due, /api/cron/kiteprop-property-feed) manualmente.",
    doc: "docs/decisions/slice-s07-follow-up-cron.md",
  },
  { key: "OPENAI_API_KEY / GEMINI_API_KEY", purpose: "Motor conversacional (ver AI_PROVIDER en .env.example).", doc: "docs/decisions/slice-s10-conversational-ai.md" },
  { key: "WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN", purpose: "Envío saliente Graph API.", doc: "docs/decisions/slice-s09-whatsapp-outbound.md" },
  { key: "WHATSAPP_VERIFY_TOKEN + WHATSAPP_ACCOUNT_SLUG (+ WHATSAPP_APP_SECRET)", purpose: "Webhook entrante.", doc: "docs/decisions/slice-s08-whatsapp-webhook.md" },
  {
    key: "META_LEAD_WEBHOOK_VERIFY_TOKEN",
    purpose: "Verificación GET del webhook Meta Lead Ads (Leadgen).",
    doc: "docs/manual-actions-required.md",
  },
  {
    key: "META_LEAD_WEBHOOK_APP_SECRET",
    purpose: "Opcional: HMAC X-Hub-Signature-256 en POST; si no está, el POST sigue sin verificar firma.",
    doc: "docs/decisions/slice-l9-meta-lead-signature-integrations-ui.md",
  },
  {
    key: "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER",
    purpose: "SMS de seguimiento automático cuando el paso del plan usa channel \"sms\".",
    doc: "docs/decisions/slice-l16-f3e5-sms-twilio-follow-up.md",
  },
];
