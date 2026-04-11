"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BranchOpt = { id: string; name: string; slug: string };

export function ContactBranchForm({
  contactId,
  branchId,
  branches,
  canMutate,
}: {
  contactId: string;
  branchId: string | null;
  branches: BranchOpt[];
  canMutate: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(branchId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMutate || branches.length === 0) {
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
          branchId: value === "" ? null : value,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>Sucursal</h3>
      {error ? <p style={{ color: "#b00020", fontSize: "0.8rem" }}>{error}</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          style={{ padding: "0.4rem", minWidth: "220px", fontSize: "0.85rem" }}
        >
          <option value="">Sin sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.slug})
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy} style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}>
          {busy ? "…" : "Guardar sucursal"}
        </button>
      </div>
    </form>
  );
}
