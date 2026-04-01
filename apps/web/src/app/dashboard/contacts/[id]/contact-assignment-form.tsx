"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdvisorOption = { id: string; name: string };

export function ContactAssignmentForm({
  contactId,
  advisors,
  currentAdvisorId,
  canMutate,
}: {
  contactId: string;
  advisors: AdvisorOption[];
  currentAdvisorId: string | null;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [advisorId, setAdvisorId] = useState(currentAdvisorId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!advisorId) {
      setError("Elegí un asesor.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId }),
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
        Reasignar a
        <select
          value={advisorId}
          onChange={(e) => setAdvisorId(e.target.value)}
          style={{ padding: "0.4rem", maxWidth: "100%" }}
          disabled={busy || advisors.length === 0}
        >
          <option value="">— Seleccionar —</option>
          {advisors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {advisors.length === 0 && (
        <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.35rem 0 0" }}>No hay asesores activos en la cuenta.</p>
      )}
      {error && (
        <p style={{ fontSize: "0.8rem", color: "#b00020", margin: "0.35rem 0 0" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || advisors.length === 0}
        style={{ marginTop: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer" }}
      >
        {busy ? "Guardando…" : "Guardar asignación"}
      </button>
    </form>
  );
}
