// integrations — WhatsApp, CRM, etc.
export { processWhatsAppWebhookBody } from "./whatsapp/process-webhook";
export { parseWhatsAppWebhookPayload } from "./whatsapp/parse-cloud-api";
export { normalizeWhatsAppPhone } from "./whatsapp/ingest-inbound";
export { sendWhatsAppTextToContact } from "./whatsapp/send-whatsapp-text";
export { getWhatsAppSendBlockReason } from "./whatsapp/whatsapp-consent";
