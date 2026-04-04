"use client";

import { inferSearchProfileFromMessagesAction } from "../contact-search-profile-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function InferProfileButton({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const r = await inferSearchProfileFromMessagesAction(contactId);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          borderRadius: 8,
          border: "1px solid #cce4ff",
          background: "#e8f4ff",
          color: "#0066cc",
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Inferiendo…" : "Inferir perfil desde mensajes entrantes"}
      </button>
      <p style={{ fontSize: "0.78rem", color: "#666", margin: "0.35rem 0 0", maxWidth: "36rem" }}>
        Reglas en español (sin IA): intención, tipo, zona, precios y ambientes. El perfil <strong>declarado</strong> por
        el equipo sigue teniendo prioridad en matching y scoring.
      </p>
      {err ? (
        <p style={{ fontSize: "0.85rem", color: "#b00020", marginTop: "0.5rem" }} role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
