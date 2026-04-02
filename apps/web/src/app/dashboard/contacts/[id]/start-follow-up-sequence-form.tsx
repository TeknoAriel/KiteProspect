"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartFollowUpSequenceForm({
  contactId,
  plans,
  canMutate,
  hasActiveSequence,
}: {
  contactId: string;
  plans: { id: string; name: string }[];
  canMutate: boolean;
  hasActiveSequence: boolean;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!planId) {
      setError("No hay planes de seguimiento.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/follow-up-sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpPlanId: planId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (plans.length === 0) {
    return (
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
        No hay planes activos. Definí uno en{" "}
        <a href="/dashboard/account/follow-up-plans" style={{ color: "#0070f3" }}>
          Cuenta → Planes de seguimiento
        </a>
        .
      </p>
    );
  }

  if (hasActiveSequence) {
    return (
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
        Ya hay un seguimiento activo para este contacto.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontSize: "0.8rem", color: "#444" }}>
          Plan:{" "}
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={busy}
            style={{ marginLeft: "0.25rem", padding: "0.25rem 0.6rem", fontSize: "0.85rem" }}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: busy ? "wait" : "pointer" }}
        >
          {busy ? "…" : "Iniciar seguimiento"}
        </button>
      </div>
      {error && <p style={{ fontSize: "0.75rem", color: "#b00020", margin: "0.35rem 0 0" }}>{error}</p>}
    </form>
  );
}
