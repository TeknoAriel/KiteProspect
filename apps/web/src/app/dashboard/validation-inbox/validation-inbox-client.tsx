"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveValidationDraftAction,
  discardValidationDraftAction,
  markManualReviewValidationAction,
  saveEditedDraftPayloadAction,
  sendApprovedDraftAction,
} from "./validation-inbox-actions";

export type ValidationRowVM = {
  id: string;
  reviewStatus: string;
  sourceChannel: string | null;
  channelConfidence: number | null;
  manualReviewRequired: boolean;
  draftKind: string | null;
  scoreTotal: number | null;
  leadId: string;
  contactId: string;
  leadLine: string;
  propertyTitle: string | null;
  draftPayload: unknown;
  editedPayload: unknown;
};

export function ValidationInboxClient({ rows }: { rows: ValidationRowVM[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expandId, setExpandId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState<Record<string, string>>({});

  function refresh() {
    router.refresh();
  }

  function run(
    label: string,
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>,
  ) {
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) {
        setError(`${label}: ${r.error}`);
        return;
      }
      refresh();
    });
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          style={{
            color: "#b00020",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </p>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.88rem",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "0.5rem" }}>Estado</th>
            <th style={{ padding: "0.5rem" }}>Canal</th>
            <th style={{ padding: "0.5rem" }}>Score</th>
            <th style={{ padding: "0.5rem" }}>Lead</th>
            <th style={{ padding: "0.5rem" }}>Propiedad</th>
            <th style={{ padding: "0.5rem" }}>Borrador</th>
            <th style={{ padding: "0.5rem" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const canApprove =
              row.reviewStatus === "draft_pending_review" ||
              row.reviewStatus === "manual_review_required";
            const canSend = row.reviewStatus === "approved_to_send";
            const jsonStr =
              editJson[row.id] ??
              JSON.stringify(row.editedPayload ?? {}, null, 2);
            return (
              <Fragment key={row.id}>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{row.reviewStatus}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {row.sourceChannel ?? "—"}{" "}
                    {row.channelConfidence != null
                      ? `(${row.channelConfidence})`
                      : ""}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{row.scoreTotal ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <Link
                      href={`/dashboard/contacts/${row.contactId}`}
                      style={{ color: "#0070f3" }}
                    >
                      {row.leadLine}
                    </Link>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {row.propertyTitle ?? "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{row.draftKind ?? "—"}</td>
                  <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      disabled={pending || !canApprove}
                      onClick={() =>
                        run("Aprobar", () =>
                          approveValidationDraftAction(row.id),
                        )
                      }
                      style={{ marginRight: "0.35rem", fontSize: "0.8rem" }}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={pending || row.reviewStatus === "sent"}
                      onClick={() => {
                        const reason =
                          typeof window !== "undefined"
                            ? window.prompt("Motivo descarte (opcional)") ?? ""
                            : "";
                        run("Descartar", () =>
                          discardValidationDraftAction(row.id, reason),
                        );
                      }}
                      style={{ marginRight: "0.35rem", fontSize: "0.8rem" }}
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      disabled={pending || row.reviewStatus === "sent"}
                      onClick={() =>
                        run("Manual", () =>
                          markManualReviewValidationAction(row.id),
                        )
                      }
                      style={{ marginRight: "0.35rem", fontSize: "0.8rem" }}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      disabled={pending || !canSend}
                      onClick={() =>
                        run("Enviar", () => sendApprovedDraftAction(row.id))
                      }
                      style={{ marginRight: "0.35rem", fontSize: "0.8rem" }}
                    >
                      Enviar
                    </button>
                    <button
                      type="button"
                      disabled={pending || row.reviewStatus === "sent"}
                      onClick={() =>
                        setExpandId((id) => (id === row.id ? null : row.id))
                      }
                      style={{ fontSize: "0.8rem" }}
                    >
                      {expandId === row.id ? "Cerrar edición" : "Editar JSON"}
                    </button>
                  </td>
                </tr>
                {expandId === row.id && (
                  <tr>
                    <td colSpan={7} style={{ padding: "0.75rem", background: "#fafafa" }}>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem" }}>
                        <strong>editedPayload</strong> (fusiona con el borrador original al enviar)
                      </p>
                      <textarea
                        value={jsonStr}
                        onChange={(e) =>
                          setEditJson((m) => ({
                            ...m,
                            [row.id]: e.target.value,
                          }))
                        }
                        rows={8}
                        style={{
                          width: "100%",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        }}
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(
                              editJson[row.id] ?? jsonStr,
                            ) as Record<string, unknown>;
                            run("Guardar", () =>
                              saveEditedDraftPayloadAction(row.id, parsed),
                            );
                          } catch {
                            setError("JSON inválido en edición.");
                          }
                        }}
                        style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}
                      >
                        Guardar edición
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
