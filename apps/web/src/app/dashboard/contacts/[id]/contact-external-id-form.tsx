"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContactExternalIdForm({
  contactId,
  initialExternalId,
  canMutate,
}: {
  contactId: string;
  initialExternalId: string | null;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialExternalId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate) {
    return (
      <div style={{ marginTop: "0.75rem" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>
          <strong>ID en CRM externo:</strong>{" "}
          {initialExternalId ? (
            <code style={{ fontSize: "0.8rem" }}>{initialExternalId}</code>
          ) : (
            <span style={{ color: "#888" }}>—</span>
          )}
        </p>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#888" }}>
          Solo administradores o coordinadores pueden editar este vínculo.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const trimmed = value.trim();
      const res = await fetch(`/api/contacts/${contactId}/external`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId: trimmed.length === 0 ? null : trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: "0.75rem" }}>
      <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
        ID en CRM externo
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="p. ej. id devuelto por tu CRM"
          autoComplete="off"
          maxLength={256}
          style={{ padding: "0.4rem", maxWidth: "100%" }}
          disabled={busy}
        />
      </label>
      <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#888" }}>
        Opcional. Dejá vacío y guardá para quitar el vínculo. Integraciones server-side pueden usar{" "}
        <code style={{ fontSize: "0.72rem" }}>PATCH /api/contacts/&#123;id&#125;/external</code> con la misma auth que
        captura.
      </p>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "#b00020", margin: "0.35rem 0 0" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        style={{ marginTop: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer" }}
      >
        {busy ? "Guardando…" : "Guardar ID externo"}
      </button>
    </form>
  );
}
