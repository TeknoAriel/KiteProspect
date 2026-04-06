"use client";

import {
  COMMERCIAL_STAGES,
  CONVERSATIONAL_STAGES,
} from "@/domains/crm-leads/contact-stage-constants";
import {
  COMMERCIAL_STAGE_LABEL_ES,
  CONVERSATIONAL_STAGE_LABEL_ES,
} from "@/domains/core-prospeccion/latin-stage-labels";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContactStagesForm({
  contactId,
  commercialStage,
  conversationalStage,
  canMutate,
}: {
  contactId: string;
  commercialStage: string;
  conversationalStage: string;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [commercial, setCommercial] = useState(commercialStage);
  const [conversational, setConversational] = useState(conversationalStage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commercialStage: commercial,
          conversationalStage: conversational,
        }),
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
    <form
      onSubmit={onSubmit}
      style={{
        marginTop: "0.75rem",
        paddingTop: "0.75rem",
        borderTop: "1px solid #eee",
        display: "grid",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#555" }}>Etapa comercial</label>
        <select
          value={commercial}
          onChange={(e) => setCommercial(e.target.value)}
          style={{ padding: "0.4rem" }}
          disabled={busy}
        >
          {COMMERCIAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {COMMERCIAL_STAGE_LABEL_ES[s]}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#555" }}>Etapa conversacional</label>
        <select
          value={conversational}
          onChange={(e) => setConversational(e.target.value)}
          style={{ padding: "0.4rem" }}
          disabled={busy}
        >
          {CONVERSATIONAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {CONVERSATIONAL_STAGE_LABEL_ES[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <p style={{ fontSize: "0.8rem", color: "#b00020", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={busy} style={{ padding: "0.35rem 0.75rem", cursor: "pointer", width: "fit-content" }}>
        {busy ? "Guardando…" : "Guardar etapas"}
      </button>
    </form>
  );
}
