"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Feedback = "interested" | "not_interested" | "viewed" | null;

const LABELS: Record<string, string> = {
  interested: "Interesa",
  not_interested: "No interesa",
  viewed: "Visto",
};

type Props = {
  contactId: string;
  matchId: string;
  current: string | null;
  canEdit: boolean;
};

export function PropertyMatchFeedback({ contactId, matchId, current, canEdit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patch(feedback: Feedback) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/property-matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      router.refresh();
    });
  }

  if (!canEdit) {
    return current ? (
      <span style={{ fontSize: "0.72rem", color: "#666" }}>Feedback: {LABELS[current] ?? current}</span>
    ) : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", justifyContent: "flex-end" }}>
        {(["interested", "viewed", "not_interested"] as const).map((key) => (
          <button
            key={key}
            type="button"
            disabled={pending}
            onClick={() => patch(current === key ? null : key)}
            style={{
              fontSize: "0.72rem",
              padding: "0.25rem 0.5rem",
              cursor: pending ? "not-allowed" : "pointer",
              background: current === key ? "#e8f4ff" : "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            {LABELS[key]}
          </button>
        ))}
      </div>
      {error && (
        <span style={{ fontSize: "0.7rem", color: "#c00" }} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
