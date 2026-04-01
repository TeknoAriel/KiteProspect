"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowUpSequenceControls({
  sequenceId,
  status,
  planName,
  canMutate,
}: {
  sequenceId: string;
  status: string;
  planName: string;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate || (status !== "active" && status !== "paused")) {
    return (
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
        Estado: <code>{status}</code>
      </p>
    );
  }

  async function patch(next: "paused" | "active") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up-sequences/${sequenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al actualizar");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
        Plan: {planName} · estado: <code>{status}</code>
      </p>
      {error && <p style={{ fontSize: "0.75rem", color: "#b00020", margin: "0.35rem 0 0" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
        {status === "active" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch("paused")}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "…" : "Pausar seguimiento"}
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch("active")}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "…" : "Reanudar seguimiento"}
          </button>
        )}
      </div>
    </div>
  );
}
