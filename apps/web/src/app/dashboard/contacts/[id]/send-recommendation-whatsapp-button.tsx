"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendPropertyRecommendationWhatsAppAction } from "./recommendation-actions";

type Props = {
  contactId: string;
  propertyMatchId: string;
  canSend: boolean;
  hasPhone: boolean;
  /** Si ya hubo envío registrado, el botón indica reenvío para reducir confusiones. */
  sentAt?: Date | null;
};

export function SendRecommendationWhatsAppButton({
  contactId,
  propertyMatchId,
  canSend,
  hasPhone,
  sentAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const disabled = !canSend || !hasPhone || pending;
  const alreadySent = Boolean(sentAt);
  const title = !canSend
    ? "Solo admin o coordinador"
    : !hasPhone
      ? "El contacto necesita teléfono para WhatsApp"
      : alreadySent
        ? "Ya se registró un envío; volver a enviar abrirá WhatsApp de nuevo."
        : undefined;

  return (
    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
      {alreadySent && (
        <span
          title="Hay un envío previo registrado en este match"
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#0a5",
            padding: "0.15rem 0.45rem",
            borderRadius: "4px",
            backgroundColor: "#e8f5e9",
          }}
        >
          Ya enviado
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        title={title}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const res = await sendPropertyRecommendationWhatsAppAction(contactId, propertyMatchId);
            if (res.ok) {
              setMessage("Enviado por WhatsApp y registrado.");
              router.refresh();
            } else {
              setMessage(res.error);
            }
          });
        }}
        style={{
          padding: "0.35rem 0.65rem",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "0.8rem",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        {pending ? "Enviando…" : alreadySent ? "Reenviar por WhatsApp" : "Enviar por WhatsApp"}
      </button>
      {message && (
        <p
          role="status"
          style={{
            marginTop: "0.35rem",
            fontSize: "0.75rem",
            color: message.startsWith("Enviado") ? "#0a0" : "#c00",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
