"use client";

import type { ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { LeadFormState } from "./actions";
import { submitLeadForm } from "./actions";

const initialState: LeadFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        marginTop: "1rem",
        padding: "0.6rem 1.2rem",
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? "Enviando…" : "Enviar"}
    </button>
  );
}

type Props = {
  accountSlug: string;
  enabled: boolean;
  /** Canal Prisma: `form` en `/lead`, `web_widget` en `/embed/lead` (widget iframe). */
  channel?: "form" | "web_widget";
  /** Texto breve encima del formulario (p. ej. embed sin branding extra). */
  intro?: ReactNode;
};

export function LeadForm({ accountSlug, enabled, channel = "form", intro }: Props) {
  const [state, formAction] = useFormState(submitLeadForm, initialState);

  if (!enabled) {
    return (
      <p style={{ color: "#666" }}>
        Este formulario está desactivado. En el servidor, define{" "}
        <code>ENABLE_PUBLIC_LEAD_FORM=true</code> en <code>.env</code> (raíz del monorepo).
      </p>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {intro}
      {/* Honeypot: debe quedar vacío */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />
      <input type="hidden" name="accountSlug" value={accountSlug} />
      <input type="hidden" name="channel" value={channel} />

      <label>
        Nombre
        <input
          name="name"
          type="text"
          maxLength={200}
          autoComplete="name"
          style={{ display: "block", width: "100%", maxWidth: "400px" }}
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          maxLength={254}
          autoComplete="email"
          style={{ display: "block", width: "100%", maxWidth: "400px" }}
        />
      </label>
      <label>
        Teléfono
        <input
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          style={{ display: "block", width: "100%", maxWidth: "400px" }}
        />
      </label>
      <label>
        Mensaje
        <textarea
          name="message"
          rows={4}
          maxLength={8000}
          style={{ display: "block", width: "100%", maxWidth: "400px" }}
        />
      </label>

      <SubmitButton />

      {state.status === "success" && (
        <p role="status" style={{ color: "#0a0", marginTop: "0.5rem" }}>
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" style={{ color: "#c00", marginTop: "0.5rem" }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
