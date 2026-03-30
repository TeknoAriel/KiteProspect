"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addContactNoteAction } from "./contact-note-actions";

type Props = {
  contactId: string;
};

export function ContactNotesForm({ contactId }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      style={{ marginBottom: "1rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await addContactNoteAction(contactId, text);
          if (res.ok) {
            setText("");
            setMessage("Nota guardada.");
            router.refresh();
          } else {
            setMessage(res.error);
          }
        });
      }}
    >
      <label htmlFor="contact-note" style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.35rem" }}>
        Agregar nota
      </label>
      <textarea
        id="contact-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={12000}
        placeholder="Texto visible en la ficha del contacto…"
        style={{
          width: "100%",
          padding: "0.5rem",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          style={{
            padding: "0.4rem 0.85rem",
            fontSize: "0.8rem",
            cursor: pending || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Guardando…" : "Guardar nota"}
        </button>
        {message && (
          <span role="status" style={{ fontSize: "0.8rem", color: message.includes("guardada") ? "#0a0" : "#c00" }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
