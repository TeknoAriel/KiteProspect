export const DEMO_SIM_CHANNEL_ID = "kite_demo_sim_v1";

export const DEMO_CHANNELS = [
  "whatsapp",
  "email",
  "sms",
  "web_widget",
  "form",
  "landing",
  "meta_lead",
] as const;

export type DemoChannel = (typeof DEMO_CHANNELS)[number];

export function isDemoChannel(s: string): s is DemoChannel {
  return (DEMO_CHANNELS as readonly string[]).includes(s);
}

/** Etiquetas UI (español). */
export const DEMO_CHANNEL_UI: Record<
  DemoChannel,
  { label: string; hint: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    hint: "Simula mensajes entrantes como si vinieran del número del lead (sin Meta).",
  },
  email: {
    label: "Email",
    hint: "Misma lógica que correo real; no envía Resend desde aquí.",
  },
  sms: {
    label: "SMS",
    hint: "Simula SMS entrante; Twilio no se usa en esta pestaña.",
  },
  web_widget: {
    label: "Widget web",
    hint: "Canal web_widget, como el iframe de captura.",
  },
  form: {
    label: "Formulario",
    hint: "Canal form (p. ej. /lead o captura similar).",
  },
  landing: {
    label: "Landing",
    hint: "Canal landing (landings externas / proxy).",
  },
  meta_lead: {
    label: "Meta Lead",
    hint: "Canal meta_lead (Lead Ads); aquí solo el hilo conversacional.",
  },
};
