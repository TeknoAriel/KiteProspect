export type ClassifiedChannel = {
  sourceChannel: "whatsapp" | "email" | "portal" | "unknown";
  sourcePortal: string | null;
  channelConfidence: number;
};

export function classifyKitepropChannel(n: {
  channelRaw?: string;
  portalRaw?: string;
}): ClassifiedChannel {
  const raw = (n.channelRaw ?? "").toLowerCase();
  const portal = n.portalRaw?.trim() || null;

  if (raw.includes("whatsapp") || raw === "wa" || raw === "whatsapp") {
    return { sourceChannel: "whatsapp", sourcePortal: portal, channelConfidence: 0.95 };
  }
  if (raw.includes("mail") || raw === "email" || raw === "e-mail") {
    return { sourceChannel: "email", sourcePortal: portal, channelConfidence: 0.95 };
  }
  if (raw.includes("portal") || raw.includes("web") || raw.includes("zonaprop") || raw.includes("ml")) {
    return { sourceChannel: "portal", sourcePortal: portal, channelConfidence: 0.75 };
  }
  if (!raw && portal) {
    return { sourceChannel: "portal", sourcePortal: portal, channelConfidence: 0.5 };
  }
  return { sourceChannel: "unknown", sourcePortal: portal, channelConfidence: 0.3 };
}

/** Canal de conversación en Prospect (Message.channel / Conversation.channel). */
export function toConversationChannel(c: ClassifiedChannel["sourceChannel"]): string {
  switch (c) {
    case "whatsapp":
      return "whatsapp";
    case "email":
      return "email";
    case "portal":
      return "landing";
    default:
      return "form";
  }
}
