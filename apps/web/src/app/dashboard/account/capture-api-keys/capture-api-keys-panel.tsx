"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type KeyRow = {
  id: string;
  name: string | null;
  keyHint: string;
  createdAt: string;
  revokedAt: string | null;
};

export function CaptureApiKeysPanel({ initialKeys }: { initialKeys: KeyRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [keys, setKeys] = useState(initialKeys);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshList() {
    startTransition(async () => {
      const res = await fetch("/api/account/capture-api-keys");
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        keys?: KeyRow[];
      };
      if (res.ok && data.keys) {
        setKeys(data.keys);
      }
      router.refresh();
    });
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {error ? (
        <p style={{ color: "#b00020", fontSize: "0.85rem" }}>{error}</p>
      ) : null}
      {newKey ? (
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
          <strong>Clave nueva (copiala ahora):</strong>
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
            {newKey}
          </pre>
          <button
            type="button"
            style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
            onClick={() => {
              void navigator.clipboard.writeText(newKey);
            }}
          >
            Copiar
          </button>{" "}
          <button type="button" style={{ fontSize: "0.8rem" }} onClick={() => setNewKey(null)}>
            Ocultar
          </button>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Etiqueta (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={pending}
          style={{ padding: "0.4rem", fontSize: "0.85rem", minWidth: "200px" }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await fetch("/api/account/capture-api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: label.trim() || undefined }),
              });
              const data = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                key?: string;
                error?: string;
              };
              if (res.ok && data.key) {
                setNewKey(data.key);
                setLabel("");
                refreshList();
              } else {
                setError(data.error ?? "Error al crear");
              }
            });
          }}
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", cursor: pending ? "wait" : "pointer" }}
        >
          {pending ? "…" : "Generar clave"}
        </button>
      </div>

      {keys.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#666" }}>No hay claves. Generá una para usar Bearer en la API pública.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "0.35rem" }}>Etiqueta</th>
              <th style={{ padding: "0.35rem" }}>Prefijo</th>
              <th style={{ padding: "0.35rem" }}>Estado</th>
              <th style={{ padding: "0.35rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.4rem" }}>{k.name ?? "—"}</td>
                <td style={{ padding: "0.4rem", fontFamily: "monospace" }}>
                  <code>{k.keyHint}</code>
                </td>
                <td style={{ padding: "0.4rem" }}>{k.revokedAt ? "revocada" : "activa"}</td>
                <td style={{ padding: "0.4rem" }}>
                  {!k.revokedAt ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm("¿Revocar esta clave? Las integraciones que la usen dejarán de funcionar.")) {
                          return;
                        }
                        setError(null);
                        startTransition(async () => {
                          const res = await fetch(`/api/account/capture-api-keys/${k.id}`, { method: "DELETE" });
                          const data = (await res.json().catch(() => ({}))) as { error?: string };
                          if (!res.ok) {
                            setError(data.error ?? "Error");
                            return;
                          }
                          refreshList();
                        });
                      }}
                      style={{ fontSize: "0.78rem", cursor: pending ? "wait" : "pointer" }}
                    >
                      Revocar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
