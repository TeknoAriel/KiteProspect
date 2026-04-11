"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WebhookEventType } from "@/domains/integrations/services/webhook-event-types";

type SubRow = {
  id: string;
  name: string | null;
  url: string;
  urlHint: string;
  events: unknown;
  createdAt: string;
  revokedAt: string | null;
};

export function WebhookSubscriptionsPanel({
  initialSubs,
  eventTypes,
}: {
  initialSubs: SubRow[];
  eventTypes: WebhookEventType[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subs, setSubs] = useState(initialSubs);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Set<WebhookEventType>>(
    () => new Set(eventTypes),
  );
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshList() {
    startTransition(async () => {
      const res = await fetch("/api/account/webhook-subscriptions");
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        subscriptions?: SubRow[];
      };
      if (res.ok && data.subscriptions) {
        setSubs(data.subscriptions);
      }
      router.refresh();
    });
  }

  function toggleEvent(e: WebhookEventType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {error ? (
        <p style={{ color: "#b00020", fontSize: "0.85rem" }}>{error}</p>
      ) : null}
      {newSecret ? (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#fff8e6",
            border: "1px solid #e6d08c",
            borderRadius: "6px",
            fontSize: "0.85rem",
          }}
        >
          <strong>Secreto para verificar firmas (copialo ahora):</strong>
          <p style={{ margin: "0.35rem 0", color: "#555" }}>
            Calculá HMAC-SHA256 del cuerpo JSON en bruto y compará con la cabecera{" "}
            <code>X-Kite-Signature</code> (prefijo <code>sha256=</code>).
          </p>
          <pre
            style={{
              margin: "0.5rem 0 0",
              padding: "0.5rem",
              background: "#fff",
              overflow: "auto",
              fontSize: "0.75rem",
              wordBreak: "break-all",
            }}
          >
            {newSecret}
          </pre>
          <button
            type="button"
            style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
            onClick={() => {
              void navigator.clipboard.writeText(newSecret);
            }}
          >
            Copiar
          </button>{" "}
          <button type="button" style={{ fontSize: "0.8rem" }} onClick={() => setNewSecret(null)}>
            Ocultar
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem", maxWidth: "520px" }}>
        <input
          type="url"
          placeholder="https://tu-servidor.com/ruta-webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={pending}
          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
        />
        <input
          type="text"
          placeholder="Etiqueta (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={pending}
          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
        />
        <div style={{ fontSize: "0.82rem", color: "#444" }}>
          Eventos:
          {eventTypes.map((ev) => (
            <label
              key={ev}
              style={{ display: "block", marginTop: "0.25rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={selected.has(ev)}
                onChange={() => toggleEvent(ev)}
                disabled={pending}
              />{" "}
              <code>{ev}</code>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            if (selected.size === 0) {
              setError("Elegí al menos un evento.");
              return;
            }
            startTransition(async () => {
              const res = await fetch("/api/account/webhook-subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: label.trim() || undefined,
                  url: url.trim(),
                  events: Array.from(selected),
                }),
              });
              const data = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                signingSecret?: string;
                error?: string;
              };
              if (res.ok && data.signingSecret) {
                setNewSecret(data.signingSecret);
                setUrl("");
                setLabel("");
                refreshList();
              } else {
                setError(data.error ?? "Error al crear");
              }
            });
          }}
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", cursor: pending ? "wait" : "pointer", width: "fit-content" }}
        >
          {pending ? "…" : "Añadir webhook"}
        </button>
      </div>

      {subs.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.85rem" }}>No hay suscripciones aún.</p>
      ) : (
        <ul style={{ fontSize: "0.82rem", lineHeight: 1.5, paddingLeft: "1.1rem" }}>
          {subs.map((s) => (
            <li key={s.id} style={{ marginBottom: "0.75rem" }}>
              <div>
                <strong>{s.name || "(sin nombre)"}</strong>
                {s.revokedAt ? (
                  <span style={{ color: "#999" }}> — revocada</span>
                ) : null}
              </div>
              <div style={{ color: "#555", wordBreak: "break-all" }}>{s.urlHint}</div>
              <div style={{ color: "#888", fontSize: "0.78rem" }}>
                {String(JSON.stringify(s.events))}
              </div>
              {!s.revokedAt ? (
                <button
                  type="button"
                  style={{ fontSize: "0.78rem", marginTop: "0.25rem" }}
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("¿Revocar esta suscripción? Dejará de recibir eventos.")) return;
                    startTransition(async () => {
                      const res = await fetch(`/api/account/webhook-subscriptions/${s.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) refreshList();
                    });
                  }}
                >
                  Revocar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
