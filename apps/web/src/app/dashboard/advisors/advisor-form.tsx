"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SerializedAdvisor } from "@/domains/advisors/advisor-types";
import { ADVISOR_STATUSES } from "@/domains/advisors/validate-advisor-payload";

type TenantUserOption = { id: string; email: string; name: string | null };

type Props = {
  canMutate: boolean;
  mode: "create" | "edit";
  initial?: SerializedAdvisor;
  tenantUsers: TenantUserOption[];
};

export function AdvisorForm({ canMutate, mode, initial, tenantUsers }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [userId, setUserId] = useState(initial?.userId ?? "");

  if (!canMutate) {
    return (
      <dl style={{ margin: 0, fontSize: "0.875rem", display: "grid", gap: "0.75rem" }}>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Nombre</dt>
          <dd style={{ margin: 0 }}>{initial?.name ?? "—"}</dd>
        </div>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Email / teléfono</dt>
          <dd style={{ margin: 0 }}>
            {initial?.email ?? "—"} · {initial?.phone ?? "—"}
          </dd>
        </div>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Usuario vinculado</dt>
          <dd style={{ margin: 0 }}>{initial?.linkedUserEmail ?? "—"}</dd>
        </div>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Estado</dt>
          <dd style={{ margin: 0 }}>{initial?.status ?? "—"}</dd>
        </div>
      </dl>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        status,
        email: email.trim() === "" ? null : email.trim().toLowerCase(),
        phone: phone.trim() === "" ? null : phone.trim(),
        userId: userId === "" ? null : userId,
      };

      const url = mode === "create" ? "/api/advisors" : `/api/advisors/${initial!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      router.push("/dashboard/advisors");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: "520px" }}>
      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "#fee", borderRadius: "6px", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Nombre</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Email (opcional)</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Teléfono (opcional)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Estado</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.5rem" }}>
          {ADVISOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Usuario de la cuenta (opcional)</span>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">Sin vincular</option>
          {tenantUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
              {u.name ? ` — ${u.name}` : ""}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>
          Un mismo usuario solo puede vincularse a un asesor en esta cuenta.
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        style={{ width: "fit-content", padding: "0.5rem 1rem", cursor: pending ? "wait" : "pointer" }}
      >
        {pending ? "Guardando…" : mode === "create" ? "Crear asesor" : "Guardar cambios"}
      </button>
    </form>
  );
}
