"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateContactNoteAction } from "./contact-note-actions";

type Props = {
  note: {
    id: string;
    content: string;
    createdAtIso: string;
    updatedAtIso: string;
  };
};

export function ContactNoteRow({ note }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const created = new Date(note.createdAtIso);
  const updated = new Date(note.updatedAtIso);
  const showEdited = updated.getTime() > created.getTime() + 1000;

  return (
    <div style={{ padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
      {!editing ? (
        <>
          <p style={{ margin: 0, fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>{note.content}</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
            {created.toLocaleString()}
            {showEdited && (
              <span style={{ marginLeft: "0.5rem" }}>· editada {updated.toLocaleString()}</span>
            )}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setText(note.content);
              setEditing(true);
              setMessage(null);
            }}
            style={{ marginTop: "0.35rem", fontSize: "0.8rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}
          >
            Editar
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            startTransition(async () => {
              const res = await updateContactNoteAction(note.id, text);
              if (res.ok) {
                setEditing(false);
                router.refresh();
              } else {
                setMessage(res.error);
              }
            });
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={12000}
            style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" disabled={pending || !text.trim()} style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" disabled={pending} onClick={() => setEditing(false)} style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}>
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
