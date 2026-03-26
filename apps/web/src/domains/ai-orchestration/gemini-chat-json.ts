/**
 * Llamada mínima a Gemini (Google AI Studio) con salida JSON (sin SDK).
 */
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiChatJsonResult =
  | { ok: true; content: string; model: string }
  | { ok: false; error: string };

export async function geminiChatJson(params: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<GeminiChatJsonResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Falta GEMINI_API_KEY en el entorno." };
  }

  /** Default: variante “lite” (mejor para free tier / bajo costo). Override: `GEMINI_MODEL`. */
  const model =
    process.env.GEMINI_MODEL?.trim() || params.model || "gemini-2.5-flash-lite";

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: params.temperature ?? 0.35,
        maxOutputTokens: params.maxTokens ?? 700,
        responseMimeType: "application/json",
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: params.system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: params.user }],
        },
      ],
    }),
  });

  const raw = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = raw.error?.message ?? res.statusText;
    return { ok: false, error: `Gemini: ${msg}` };
  }

  const content = raw.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, error: "Gemini devolvió contenido vacío." };
  }

  return { ok: true, content: content.trim(), model };
}
