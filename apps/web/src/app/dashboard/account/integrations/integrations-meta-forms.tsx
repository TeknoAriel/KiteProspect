"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  marginBottom: "0.35rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  maxWidth: "280px",
  padding: "0.45rem",
  fontSize: "0.875rem",
  boxSizing: "border-box",
};

export type MetaLeadAdsRow = {
  id: string;
  pageId: string;
  status: string;
};

type Props = {
  metaRows: MetaLeadAdsRow[];
};

export function IntegrationsMetaForms({ metaRows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ marginTop: "1.75rem" }}>
      <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Meta Lead Ads</h2>
      <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0, lineHeight: 1.5 }}>
        Vinculá el <strong>ID numérico de la página</strong> de Facebook que envía los leadgen en el webhook. Podés tener
        más de una fila si operás varias páginas. Desactivá con estado <code>paused</code> sin borrar el registro.
      </p>

      {message ? (
        <p style={{ fontSize: "0.85rem", color: message.startsWith("Error") ? "#b00020" : "#0a0", marginTop: "0.75rem" }}>
          {message}
        </p>
      ) : null}

      {metaRows.map((row) => (
        <form
          key={row.id}
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            maxWidth: "480px",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            const fd = new FormData(e.currentTarget);
            const pageId = String(fd.get("pageId") ?? "").trim();
            const status = String(fd.get("status") ?? "active");
            startTransition(async () => {
              const res = await fetch(`/api/account/integrations/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId, status }),
              });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
              if (res.ok && data.ok) {
                setMessage("Guardado.");
                router.refresh();
              } else {
                setMessage(`Error: ${data.error ?? res.statusText}`);
              }
            });
          }}
        >
          <label htmlFor={`page-${row.id}`} style={labelStyle}>
            Page ID
          </label>
          <input
            id={`page-${row.id}`}
            name="pageId"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={row.pageId}
            required
            style={inputStyle}
          />
          <label htmlFor={`st-${row.id}`} style={{ ...labelStyle, marginTop: "0.75rem" }}>
            Estado
          </label>
          <select id={`st-${row.id}`} name="status" defaultValue={row.status} style={{ ...inputStyle, maxWidth: "200px" }}>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
          <div style={{ marginTop: "0.75rem" }}>
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: "0.45rem 0.9rem",
                fontSize: "0.875rem",
                cursor: pending ? "wait" : "pointer",
              }}
            >
              Guardar
            </button>
          </div>
        </form>
      ))}

      <form
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          border: "1px dashed #ccc",
          borderRadius: "8px",
          maxWidth: "480px",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          const fd = new FormData(e.currentTarget);
          const pageId = String(fd.get("pageId") ?? "").trim();
          startTransition(async () => {
            const res = await fetch("/api/account/integrations/meta-lead-ads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pageId }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
            if (res.ok && data.ok) {
              setMessage("Integración creada.");
              (e.target as HTMLFormElement).reset();
              router.refresh();
            } else {
              setMessage(`Error: ${data.error ?? res.statusText}`);
            }
          });
        }}
      >
        <p style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: 0 }}>Añadir otra página</p>
        <label htmlFor="new-page-id" style={labelStyle}>
          Page ID (nuevo)
        </label>
        <input id="new-page-id" name="pageId" type="text" inputMode="numeric" required style={inputStyle} />
        <div style={{ marginTop: "0.75rem" }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.875rem",
              cursor: pending ? "wait" : "pointer",
            }}
          >
            Crear integración
          </button>
        </div>
      </form>
    </div>
  );
}
