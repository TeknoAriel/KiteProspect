"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recalculatePropertyMatchesAction } from "./matching-actions";

type Props = {
  contactId: string;
};

export function RecalculateMatchesButton({ contactId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const res = await recalculatePropertyMatchesAction(contactId);
            if (res.ok) {
              setMessage(`Matches actualizados: ${res.matchedCount} propiedad(es) sobre el umbral.`);
              router.refresh();
            } else {
              setMessage(res.error);
            }
          });
        }}
        style={{
          padding: "0.5rem 1rem",
          cursor: pending ? "wait" : "pointer",
          fontSize: "0.875rem",
        }}
      >
        {pending ? "Calculando…" : "Recalcular matches (inventario)"}
      </button>
      {message && (
        <p
          role="status"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            color: message.startsWith("No ") || message.includes("No hay") ? "#c00" : "#333",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
