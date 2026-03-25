"use client";

import { useState } from "react";

type Initial = {
  aiConversationPromptVersion?: string;
  aiConversationSystemPromptAppend?: string;
};

export function AiPromptConfigForm(props: { initial: Initial }) {
  const [version, setVersion] = useState(
    props.initial.aiConversationPromptVersion ?? "",
  );
  const [append, setAppend] = useState(
    props.initial.aiConversationSystemPromptAppend ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/ai-prompt-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiConversationPromptVersion: version.trim() || null,
          aiConversationSystemPromptAppend: append.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setMessage("Guardado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="ai-ver"
          style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
        >
          Etiqueta de versión (auditoría)
        </label>
        <input
          id="ai-ver"
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="ej. s11-v1 o mi-empresa-2025-03"
          maxLength={120}
          style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
        />
        <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.35rem 0 0" }}>
          Si está vacío, se usa la variable de entorno o el default del código.
        </p>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="ai-append"
          style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
        >
          Instrucciones adicionales (append al system prompt)
        </label>
        <textarea
          id="ai-append"
          value={append}
          onChange={(e) => setAppend(e.target.value)}
          rows={8}
          maxLength={4000}
          placeholder="Tono, prohibiciones suaves, firma comercial sugerida…"
          style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{ padding: "0.5rem 1rem", cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "Guardando…" : "Guardar"}
      </button>
      {message && (
        <span style={{ marginLeft: "1rem", color: "#0a0", fontSize: "0.875rem" }}>
          {message}
        </span>
      )}
      {error && (
        <p style={{ color: "#c00", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
    </form>
  );
}
