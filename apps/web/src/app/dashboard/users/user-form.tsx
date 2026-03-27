"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SerializedUser } from "@/domains/users/user-types";
import { USER_ROLES, USER_STATUSES } from "@/domains/users/validate-user-payload";

type Props = {
  canMutate: boolean;
  mode: "create" | "edit";
  initial?: SerializedUser;
};

export function UserForm({ canMutate, mode, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "advisor");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [password, setPassword] = useState("");

  if (!canMutate) {
    return (
      <dl style={{ margin: 0, fontSize: "0.875rem", display: "grid", gap: "0.75rem" }}>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Email</dt>
          <dd style={{ margin: 0 }}>{initial?.email ?? "—"}</dd>
        </div>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Nombre</dt>
          <dd style={{ margin: 0 }}>{initial?.name ?? "—"}</dd>
        </div>
        <div>
          <dt style={{ color: "#666", margin: 0 }}>Rol / Estado</dt>
          <dd style={{ margin: 0 }}>
            {initial?.role ?? "—"} · {initial?.status ?? "—"}
          </dd>
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
        email: email.trim().toLowerCase(),
        name: name.trim() === "" ? null : name.trim(),
        role,
        status,
      };
      if (password.trim() !== "") payload.password = password;
      if (mode === "create" && password.trim() === "") {
        setError("La contraseña es obligatoria para crear");
        return;
      }

      const url = mode === "create" ? "/api/users" : `/api/users/${initial!.id}`;
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
      router.push("/dashboard/users");
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
        <span>Email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Nombre (opcional)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: "0.5rem" }}>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Estado</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.5rem" }}>
            {USER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>{mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}</span>
        <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <button type="submit" disabled={pending} style={{ width: "fit-content", padding: "0.5rem 1rem", cursor: pending ? "wait" : "pointer" }}>
        {pending ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
      </button>
    </form>
  );
}
