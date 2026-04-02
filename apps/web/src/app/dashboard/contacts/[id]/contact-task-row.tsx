"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeContactTaskAction, updateContactTaskAction } from "./contact-task-actions";

function taskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    call: "Llamada",
    visit: "Visita",
    followup: "Seguimiento",
    other: "Otro",
  };
  return map[type] ?? type;
}

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  task: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    dueAtIso: string | null;
  };
};

export function ContactTaskRow({ task }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [type, setType] = useState(task.type);
  const [dueAt, setDueAt] = useState(isoToDatetimeLocal(task.dueAtIso));
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");

  return (
    <div style={{ padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
      {!editing ? (
        <>
          <p style={{ margin: 0 }}>
            <strong>{task.title}</strong>
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#666" }}>
              ({taskTypeLabel(task.type)})
            </span>
          </p>
          {task.description && <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>{task.description}</p>}
          {task.dueAtIso && (
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#666" }}>
              Vence: {new Date(task.dueAtIso).toLocaleString()}
            </p>
          )}
          <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setMessage(null);
                startTransition(async () => {
                  const res = await completeContactTaskAction(task.id);
                  if (res.ok) {
                    router.refresh();
                  } else {
                    setMessage(res.error);
                  }
                });
              }}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", cursor: pending ? "wait" : "pointer" }}
            >
              Marcar hecha
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setTitle(task.title);
                setDescription(task.description ?? "");
                setType(task.type);
                setDueAt(isoToDatetimeLocal(task.dueAtIso));
                setStatus("pending");
                setEditing(true);
                setMessage(null);
              }}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", cursor: "pointer" }}
            >
              Editar
            </button>
            {message && (
              <span style={{ fontSize: "0.75rem", color: "#c00" }} role="status">
                {message}
              </span>
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            startTransition(async () => {
              const res = await updateContactTaskAction(task.id, {
                title,
                description: description.trim() || undefined,
                type,
                dueAtIso: dueAt.trim() || null,
                status,
              });
              if (res.ok) {
                setEditing(false);
                router.refresh();
              } else {
                setMessage(res.error);
              }
            });
          }}
        >
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              required
              style={{ width: "100%", padding: "0.4rem", fontSize: "0.875rem", boxSizing: "border-box" }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={8000}
              placeholder="Descripción"
              style={{ width: "100%", padding: "0.4rem", fontSize: "0.875rem", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem" }}>
                Tipo{" "}
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ fontSize: "0.8rem", marginLeft: "0.25rem" }}>
                  <option value="call">Llamada</option>
                  <option value="visit">Visita</option>
                  <option value="followup">Seguimiento</option>
                  <option value="other">Otro</option>
                </select>
              </label>
              <label style={{ fontSize: "0.8rem" }}>
                Estado{" "}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "pending" | "completed" | "cancelled")}
                  style={{ fontSize: "0.8rem", marginLeft: "0.25rem" }}
                >
                  <option value="pending">Pendiente</option>
                  <option value="completed">Hecha</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </label>
              <label style={{ fontSize: "0.8rem" }}>
                Vence{" "}
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  style={{ fontSize: "0.8rem", marginLeft: "0.25rem" }}
                />
              </label>
            </div>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" disabled={pending} style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
            >
              Cancelar
            </button>
            {message && (
              <span style={{ fontSize: "0.75rem", color: "#c00" }} role="status">
                {message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
