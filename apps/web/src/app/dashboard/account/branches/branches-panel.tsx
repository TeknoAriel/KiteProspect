"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type BranchRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  _count: { contacts: number };
};

export function BranchesPanel({ initialBranches }: { initialBranches: BranchRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [branches, setBranches] = useState(initialBranches);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refreshList() {
    startTransition(async () => {
      const res = await fetch("/api/account/branches?includeArchived=1");
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; branches?: BranchRow[] };
      if (res.ok && data.branches) {
        setBranches(data.branches);
      }
      router.refresh();
    });
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {error ? <p style={{ color: "#b00020", fontSize: "0.85rem" }}>{error}</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Nombre sucursal (ej. Palermo)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          style={{ padding: "0.4rem", fontSize: "0.85rem", minWidth: "240px" }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await fetch("/api/account/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
              });
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              if (res.ok) {
                setName("");
                refreshList();
              } else {
                setError(data.error ?? "Error");
              }
            });
          }}
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", cursor: pending ? "wait" : "pointer" }}
        >
          {pending ? "…" : "Crear sucursal"}
        </button>
      </div>

      {branches.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.85rem" }}>No hay sucursales. Creá una para asignar contactos y filtrar.</p>
      ) : (
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.5, paddingLeft: "1.1rem" }}>
          {branches.map((b) => (
            <li key={b.id} style={{ marginBottom: "0.75rem" }}>
              <strong>{b.name}</strong> <code style={{ fontSize: "0.78rem" }}>{b.slug}</code>{" "}
              <span style={{ color: "#888" }}>
                ({b._count.contacts} contactos) — {b.status}
              </span>
              {b.status === "active" ? (
                <button
                  type="button"
                  style={{ marginLeft: "0.5rem", fontSize: "0.78rem" }}
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("¿Archivar esta sucursal? Los contactos conservan la etiqueta si no la cambiás.")) return;
                    startTransition(async () => {
                      await fetch(`/api/account/branches/${b.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "archived" }),
                      });
                      refreshList();
                    });
                  }}
                >
                  Archivar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
