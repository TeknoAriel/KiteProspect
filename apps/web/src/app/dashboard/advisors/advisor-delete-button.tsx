"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { advisorId: string; disabled?: boolean };

export function AdvisorDeleteButton({ advisorId, disabled }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (disabled) return null;

  async function onDelete() {
    setPending(true);
    try {
      const res = await fetch(`/api/advisors/${advisorId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        alert(j.error ?? "No se pudo eliminar");
        return;
      }
      router.push("/dashboard/advisors");
      router.refresh();
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            backgroundColor: "#fff",
            color: "#c00",
            border: "1px solid #fcc",
          }}
        >
          Eliminar asesor
        </button>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#666" }}>
            ¿Seguro? Se eliminan también las asignaciones contacto↔asesor ligadas a este registro.
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            style={{
              padding: "0.5rem 1rem",
              cursor: pending ? "wait" : "pointer",
              backgroundColor: "#c00",
              color: "#fff",
              border: "none",
            }}
          >
            {pending ? "Eliminando…" : "Confirmar eliminación"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirmOpen(false)} style={{ padding: "0.5rem 1rem" }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
