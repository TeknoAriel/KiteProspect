/** Etiqueta legible para `Conversation.channel` en UI de reportes y listas. */
export function formatChannelLabel(channel: string): string {
  const m: Record<string, string> = {
    whatsapp: "WhatsApp",
    form: "Formulario",
    web_widget: "Widget web",
    landing: "Landing",
    web: "Web",
    sin_conversacion: "Sin conversación",
  };
  return m[channel] ?? channel;
}
