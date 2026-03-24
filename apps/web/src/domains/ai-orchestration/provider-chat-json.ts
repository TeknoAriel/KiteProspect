import { geminiChatJson } from "./gemini-chat-json";
import { openAIChatJson } from "./openai-chat-json";

export type ProviderChatJsonResult =
  | { ok: true; content: string; model: string; provider: "gemini" | "openai" }
  | { ok: false; error: string };

export async function callAIProviderJson(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ProviderChatJsonResult> {
  const provider = (process.env.AI_PROVIDER?.trim().toLowerCase() ||
    "gemini") as "gemini" | "openai";

  if (provider === "openai") {
    const r = await openAIChatJson(params);
    if (!r.ok) return r;
    return { ok: true, content: r.content, model: r.model, provider };
  }

  const r = await geminiChatJson(params);
  if (!r.ok) return r;
  return { ok: true, content: r.content, model: r.model, provider: "gemini" };
}
