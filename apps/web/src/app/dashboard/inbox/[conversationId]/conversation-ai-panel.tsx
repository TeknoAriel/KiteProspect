"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConversationAiPanel(props: {
  conversationId: string;
  contactId: string;
  channel: string;
  userRole: string;
}) {
  const router = useRouter();
  const canUseAi =
    props.userRole === "admin" || props.userRole === "coordinator";
  const canSendWa = canUseAi && props.channel === "whatsapp";

  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [meta, setMeta] = useState<{
    kind: string;
    reason?: string;
    summaryForHuman?: string;
    modelSuggestedKind?: string;
    appliedRuleIds?: string[];
    promptVersion?: string;
  } | null>(null);

  async function suggest() {
    setError(null);
    setLoading(true);
    setMeta(null);
    try {
      const res = await fetch("/api/ai/conversation/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: props.conversationId }),
      });
      const data = (await res.json()) as {
        error?: string;
        action?: {
          kind: string;
          draftReply?: string;
          reason?: string;
          summaryForHuman?: string;
        };
        modelSuggestedKind?: string;
        appliedRuleIds?: string[];
        promptVersion?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Error al planificar acción");
        return;
      }
      const action = data.action;
      if (!action) {
        setError("Respuesta sin acción");
        return;
      }
      setMeta({
        kind: action.kind,
        reason: action.reason,
        summaryForHuman: action.summaryForHuman,
        modelSuggestedKind: data.modelSuggestedKind,
        appliedRuleIds: data.appliedRuleIds,
        promptVersion: data.promptVersion,
      });
      if (action.kind === "reply") {
        setDraft(action.draftReply ?? "");
      } else {
        setDraft("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendWhatsApp() {
    const text = draft.trim();
    if (!text) return;
    setError(null);
    setSendLoading(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: props.contactId, text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al enviar");
        return;
      }
      setDraft("");
      setMeta(null);
      router.refresh();
    } finally {
      setSendLoading(false);
    }
  }

  if (!canUseAi) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fafafa",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "#666",
        }}
      >
        La asistencia IA está disponible para coordinadores y administradores.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Asistencia IA</h3>
      <button
        type="button"
        onClick={suggest}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Generando…" : "Sugerir respuesta (IA)"}
      </button>
      {error && (
        <p style={{ color: "#c00", fontSize: "0.875rem" }}>{error}</p>
      )}
      {meta && (
        <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
          <p>
            <strong>Resultado:</strong> {meta.kind}
            {meta.promptVersion ? ` · versión ${meta.promptVersion}` : ""}
          </p>
          {meta.modelSuggestedKind &&
            meta.modelSuggestedKind !== meta.kind && (
              <p style={{ color: "#666" }}>
                Modelo sugirió: {meta.modelSuggestedKind}
              </p>
            )}
          {meta.appliedRuleIds && meta.appliedRuleIds.length > 0 && (
            <p style={{ color: "#666" }}>
              Reglas aplicadas: {meta.appliedRuleIds.join(", ")}
            </p>
          )}
          {(meta.kind === "handoff" || meta.kind === "noop") &&
            meta.reason && (
              <p style={{ marginTop: "0.5rem" }}>{meta.reason}</p>
            )}
        </div>
      )}
      {meta?.kind === "reply" && (
        <div style={{ marginTop: "1rem" }}>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}
          >
            Borrador (editable antes de enviar)
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              maxWidth: "640px",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              padding: "0.5rem",
            }}
          />
          {canSendWa ? (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                onClick={sendWhatsApp}
                disabled={sendLoading || !draft.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  cursor: sendLoading ? "wait" : "pointer",
                }}
              >
                {sendLoading ? "Enviando…" : "Enviar por WhatsApp"}
              </button>
              <span
                style={{ marginLeft: "1rem", fontSize: "0.75rem", color: "#666" }}
              >
                Requiere variables Meta y teléfono del contacto.
              </span>
            </div>
          ) : (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666",
                marginTop: "0.5rem",
              }}
            >
              Para envío directo por WhatsApp usá una conversación con canal{" "}
              <strong>whatsapp</strong>. En otros canales copiá el texto a mano.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
