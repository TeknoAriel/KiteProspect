"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateFollowUpPlanAction } from "./follow-up-plan-actions";

export type FollowUpPlanFormInitial = {
  id: string;
  name: string;
  description: string | null;
  intensity: string;
  maxAttempts: number;
  status: string;
  sequence: unknown;
};

type Props = {
  plan: FollowUpPlanFormInitial;
};

export function FollowUpPlanForm({ plan }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const sequenceDefault = JSON.stringify(plan.sequence ?? [], null, 2);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await updateFollowUpPlanAction(plan.id, fd);
          if (res.ok) {
            setMessage("Cambios guardados.");
            router.refresh();
          } else {
            setMessage(res.error);
          }
        });
      }}
      style={{ display: "grid", gap: "1rem", maxWidth: "640px" }}
    >
      <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
        Nombre
        <input
          name="name"
          required
          defaultValue={plan.name}
          style={{ padding: "0.5rem", fontSize: "0.9rem" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
        Descripción
        <textarea
          name="description"
          rows={2}
          defaultValue={plan.description ?? ""}
          style={{ padding: "0.5rem", fontSize: "0.9rem" }}
        />
      </label>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
          Intensidad
          <select name="intensity" defaultValue={plan.intensity} style={{ padding: "0.45rem" }}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
          Máx. intentos
          <input
            name="maxAttempts"
            type="number"
            min={1}
            max={500}
            defaultValue={plan.maxAttempts}
            style={{ padding: "0.5rem", width: "100px" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
          Estado del plan
          <select name="status" defaultValue={plan.status} style={{ padding: "0.45rem" }}>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="archived">archived</option>
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", color: "#555" }}>
        Secuencia (JSON) — pasos que usa el cron
        <textarea
          name="sequence"
          required
          rows={14}
          defaultValue={sequenceDefault}
          spellCheck={false}
          style={{
            padding: "0.6rem",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
        />
      </label>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#666" }}>
        Cada elemento: <code>step</code>, <code>delayHours</code> (horas hasta el siguiente intento),{" "}
        <code>channel</code> (<code>whatsapp</code> = Meta; <code>email</code> = Resend si variables de entorno;{" "}
        <code>instagram</code> u otros = tarea CRM manual), <code>objective</code> (cuerpo WA / email o guía para la
        tarea).
      </p>
      <button
        type="submit"
        disabled={pending}
        style={{ padding: "0.55rem 1rem", cursor: pending ? "wait" : "pointer", width: "fit-content" }}
      >
        {pending ? "Guardando…" : "Guardar plan"}
      </button>
      {message && (
        <p
          role="status"
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: message === "Cambios guardados." ? "#0a0" : "#c00",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
