/**
 * Llamada mínima a OpenAI Chat Completions con salida JSON (sin SDK).
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAIChatJsonResult =
  | { ok: true; content: string; model: string }
  | { ok: false; error: string };

export async function openAIChatJson(params: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<OpenAIChatJsonResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Falta OPENAI_API_KEY en el entorno." };
  }

  const model =
    process.env.OPENAI_MODEL?.trim() || params.model || "gpt-4o-mini";

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: params.temperature ?? 0.35,
      max_tokens: params.maxTokens ?? 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });

  const raw = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = raw.error?.message ?? res.statusText;
    return { ok: false, error: `OpenAI: ${msg}` };
  }

  const content = raw.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, error: "OpenAI devolvió contenido vacío." };
  }

  return { ok: true, content: content.trim(), model };
}
