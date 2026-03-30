"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addContactTaskAction } from "./contact-task-actions";

type Props = {
  contactId: string;
};

export function ContactTasksForm({ contactId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("followup");
  const [dueAt, setDueAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      style={{ marginBottom: "1rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await addContactTaskAction(contactId, {
            title,
            description: description.trim() || undefined,
            type,
            dueAtIso: dueAt.trim() || null,
          });
          if (res.ok) {
            setTitle("");
            setDescription("");
            setDueAt("");
            setMessage("Tarea creada.");
            router.refresh();
          } else {
            setMessage(res.error);
          }
        });
      }}
    >
      <p style={{ fontSize: "0.8rem", marginBottom: "0.5rem", fontWeight: 600 }}>Nueva tarea</p>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (obligatorio)"
          maxLength={500}
          required
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "0.875rem",
            boxSizing: "border-box",
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={8000}
          placeholder="Descripción (opcional)"
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.35rem" }}>
              <option value="call">Llamada</option>
              <option value="visit">Visita</option>
              <option value="followup">Seguimiento</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            Vence
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "0.35rem" }}
            />
          </label>
        </div>
      </div>
      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          style={{
            padding: "0.4rem 0.85rem",
            fontSize: "0.8rem",
            cursor: pending || !title.trim() ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Guardando…" : "Crear tarea"}
        </button>
        {message && (
          <span role="status" style={{ fontSize: "0.8rem", color: message.includes("creada") ? "#0a0" : "#c00" }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
