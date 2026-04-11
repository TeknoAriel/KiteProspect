"use client";

import {
  DEMO_CHANNELS,
  DEMO_CHANNEL_UI,
  type DemoChannel,
} from "@/domains/conversations/demo-channel-simulation.constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Ids = Partial<
  Record<DemoChannel, { conversationId: string; contactId: string }>
>;

export function DemoChannelsClient() {
  const router = useRouter();
  const [tab, setTab] = useState<DemoChannel>("whatsapp");
  const [ids, setIds] = useState<Ids>({});
  const [inbound, setInbound] = useState("");
  const [loadingIn, setLoadingIn] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingOut, setLoadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [meta, setMeta] = useState<{
    kind: string;
    reason?: string;
    promptVersion?: string;
  } | null>(null);

  const current = ids[tab];

  const onInbound = useCallback(async () => {
    setError(null);
    setLoadingIn(true);
    try {
      const res = await fetch("/api/demo/sim/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: tab, text: inbound }),
      });
      const data = (await res.json()) as {
        error?: string;
        conversationId?: string;
        contactId?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Error al registrar");
        return;
      }
      if (data.conversationId && data.contactId) {
        setIds((prev) => ({
          ...prev,
          [tab]: { conversationId: data.conversationId!, contactId: data.contactId! },
        }));
        setInbound("");
        setMeta(null);
        setDraft("");
        router.refresh();
      }
    } finally {
      setLoadingIn(false);
    }
  }, [inbound, router, tab]);

  const onSuggest = useCallback(async () => {
    if (!current?.conversationId) return;
    setError(null);
    setLoadingAi(true);
    setMeta(null);
    try {
      const res = await fetch("/api/ai/conversation/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: current.conversationId }),
      });
      const data = (await res.json()) as {
        error?: string;
        action?: { kind: string; draftReply?: string; reason?: string };
        promptVersion?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Error IA");
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
        promptVersion: data.promptVersion,
      });
      if (action.kind === "reply") {
        setDraft(action.draftReply ?? "");
      } else {
        setDraft("");
      }
    } finally {
      setLoadingAi(false);
    }
  }, [current?.conversationId]);

  const onOutboundDemo = useCallback(async () => {
    const text = draft.trim();
    if (!current?.conversationId || !text) return;
    setError(null);
    setLoadingOut(true);
    try {
      const res = await fetch("/api/demo/sim/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: current.conversationId, text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al registrar respuesta");
        return;
      }
      setDraft("");
      setMeta(null);
      router.refresh();
    } finally {
      setLoadingOut(false);
    }
  }, [current?.conversationId, draft, router]);

  const ui = DEMO_CHANNEL_UI[tab];

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.875rem" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
            ← Operaciones
          </Link>
          <Link href="/dashboard/demo-simulation" style={{ textDecoration: "none", color: "#0070f3" }}>
            Laboratorio 20 escenarios
          </Link>
        </div>
        <h1 style={{ marginTop: "0.75rem", marginBottom: "0.35rem" }}>
          Demo por canal
        </h1>
        <p style={{ margin: 0, color: "#555", fontSize: "0.9rem", lineHeight: 1.5 }}>
          Cada pestaña crea o reutiliza un hilo de demostración con el mismo{" "}
          <code style={{ fontSize: "0.8rem" }}>channel</code> que en producción. Los mensajes
          salientes desde aquí no llaman a Meta, Resend ni Twilio: solo quedan en el CRM y en
          el inbox para probar reglas e IA.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "0.5rem",
        }}
      >
        {DEMO_CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => {
              setTab(ch);
              setError(null);
            }}
            style={{
              padding: "0.4rem 0.65rem",
              fontSize: "0.8rem",
              cursor: "pointer",
              borderRadius: "6px",
              border: tab === ch ? "2px solid #0070f3" : "1px solid #ccc",
              background: tab === ch ? "#f0f7ff" : "#fff",
            }}
          >
            {DEMO_CHANNEL_UI[ch].label}
          </button>
        ))}
      </div>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>{ui.label}</h2>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#666" }}>
          {ui.hint}
        </p>
        {current && (
          <p style={{ fontSize: "0.8rem", color: "#444", marginBottom: "0.75rem" }}>
            <Link
              href={`/dashboard/inbox/${current.conversationId}`}
              style={{ color: "#0070f3" }}
            >
              Abrir en inbox
            </Link>
            {" · "}
            <Link
              href={`/dashboard/contacts/${current.contactId}`}
              style={{ color: "#0070f3" }}
            >
              Ficha contacto
            </Link>
          </p>
        )}
        <label
          style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}
        >
          Mensaje del lead (entrante)
        </label>
        <textarea
          value={inbound}
          onChange={(e) => setInbound(e.target.value)}
          rows={4}
          placeholder="Escribí como si fueras el lead por este canal…"
          style={{
            width: "100%",
            maxWidth: "640px",
            fontFamily: "inherit",
            fontSize: "0.875rem",
            padding: "0.5rem",
          }}
        />
        <div style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onInbound}
            disabled={loadingIn || !inbound.trim()}
            style={{
              padding: "0.5rem 1rem",
              cursor: loadingIn ? "wait" : "pointer",
            }}
          >
            {loadingIn ? "Guardando…" : "Registrar mensaje del lead"}
          </button>
        </div>
      </section>

      <section
        style={{
          padding: "1.25rem",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Evaluar flujo con IA</h3>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0 }}>
          Tras al menos un mensaje entrante, podés pedir la misma sugerencia que en el inbox.
          La respuesta del equipo se registra en el hilo sin enviar a proveedores externos.
        </p>
        <button
          type="button"
          onClick={onSuggest}
          disabled={loadingAi || !current?.conversationId}
          style={{
            padding: "0.5rem 1rem",
            cursor: loadingAi ? "wait" : "pointer",
            marginBottom: "0.75rem",
          }}
        >
          {loadingAi ? "Generando…" : "Sugerir respuesta (IA)"}
        </button>
        {meta && (
          <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            <strong>Resultado:</strong> {meta.kind}
            {meta.promptVersion ? ` · versión ${meta.promptVersion}` : ""}
            {(meta.kind === "handoff" || meta.kind === "noop") && meta.reason && (
              <p style={{ margin: "0.35rem 0 0", color: "#555" }}>{meta.reason}</p>
            )}
          </div>
        )}
        {meta?.kind === "reply" && (
          <>
            <label
              style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}
            >
              Borrador (editable)
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
            <div style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                onClick={onOutboundDemo}
                disabled={loadingOut || !draft.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  cursor: loadingOut ? "wait" : "pointer",
                }}
              >
                {loadingOut
                  ? "Guardando…"
                  : "Registrar respuesta del equipo (solo demo)"}
              </button>
            </div>
          </>
        )}
      </section>

      {error && (
        <p style={{ color: "#b00", fontSize: "0.875rem", marginTop: "1rem" }}>{error}</p>
      )}
    </div>
  );
}
