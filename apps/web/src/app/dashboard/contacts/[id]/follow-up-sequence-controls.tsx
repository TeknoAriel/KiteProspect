"use client";

import {
  FOLLOW_UP_BRANCH_KEYS,
  FOLLOW_UP_BRANCH_LABEL_ES,
  isFollowUpBranchKey,
} from "@/domains/core-prospeccion/follow-up-branches";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function FollowUpSequenceControls({
  sequenceId,
  status,
  planName,
  canMutate,
  matrixBranchKey,
  matrixBranchLocked,
}: {
  sequenceId: string;
  status: string;
  planName: string;
  canMutate: boolean;
  matrixBranchKey: string | null;
  matrixBranchLocked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState<string>(() =>
    matrixBranchKey && isFollowUpBranchKey(matrixBranchKey) ? matrixBranchKey : "good_response",
  );

  useEffect(() => {
    if (matrixBranchKey && isFollowUpBranchKey(matrixBranchKey)) {
      setDraftKey(matrixBranchKey);
    }
  }, [matrixBranchKey]);

  if (!canMutate || (status !== "active" && status !== "paused")) {
    return (
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
        Estado: <code>{status}</code>
      </p>
    );
  }

  async function patchJson(body: Record<string, unknown>) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up-sequences/${sequenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function patchStatus(next: "paused" | "active") {
    await patchJson({ status: next });
  }

  async function saveBranchAndLock() {
    if (!isFollowUpBranchKey(draftKey)) {
      setError("Rama inválida.");
      return;
    }
    await patchJson({ matrixBranchKey: draftKey, matrixBranchLocked: true });
  }

  async function unlockBranch() {
    await patchJson({ matrixBranchLocked: false });
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
        Plan: {planName} · estado: <code>{status}</code>
      </p>
      {matrixBranchLocked ? (
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#555" }}>
          Rama fijada manualmente (el cron no la sobrescribe).
        </p>
      ) : null}
      {error && <p style={{ fontSize: "0.75rem", color: "#b00020", margin: "0.35rem 0 0" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
        {status === "active" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patchStatus("paused")}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "…" : "Pausar seguimiento"}
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patchStatus("active")}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "…" : "Reanudar seguimiento"}
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: "0.75rem",
          paddingTop: "0.65rem",
          borderTop: "1px solid #eee",
          fontSize: "0.78rem",
        }}
      >
        <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>Rama de matriz</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <label htmlFor={`branch-${sequenceId}`} style={{ marginRight: "0.25rem" }}>
            Valor
          </label>
          <select
            id={`branch-${sequenceId}`}
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            disabled={busy}
            style={{ fontSize: "0.78rem", padding: "0.25rem" }}
          >
            {FOLLOW_UP_BRANCH_KEYS.map((k) => (
              <option key={k} value={k}>
                {FOLLOW_UP_BRANCH_LABEL_ES[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => saveBranchAndLock()}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem", cursor: busy ? "wait" : "pointer" }}
          >
            Guardar y fijar
          </button>
          {matrixBranchLocked ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => unlockBranch()}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem", cursor: busy ? "wait" : "pointer" }}
            >
              Volver a automático
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
