"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendPropertyRecommendationWhatsAppAction } from "./recommendation-actions";

type Props = {
  contactId: string;
  propertyMatchId: string;
  canSend: boolean;
  hasPhone: boolean;
};

export function SendRecommendationWhatsAppButton({
  contactId,
  propertyMatchId,
  canSend,
  hasPhone,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const disabled = !canSend || !hasPhone || pending;
  const title = !canSend
    ? "Solo admin o coordinador"
    : !hasPhone
      ? "El contacto necesita teléfono para WhatsApp"
      : undefined;

  return (
    <div style={{ marginTop: "0.5rem" }}>
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
        {pending ? "Enviando…" : "Enviar por WhatsApp"}
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
