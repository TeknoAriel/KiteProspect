import type { NormalizedKitepropImport } from "./kiteprop-rest-types";
import type { ClassifiedChannel } from "./classify-kiteprop-channel";

export type DraftPayload = {
  whatsapp?: {
    body: string;
    suggestedNextStep: string;
    alternativeNote?: string;
  };
  email?: {
    subject: string;
    body: string;
    cta: string;
    similarOfferLine?: string;
  };
  manualReviewRequired?: boolean;
  manualReason?: string;
};

export function generateReplyDrafts(input: {
  normalized: NormalizedKitepropImport;
  channel: ClassifiedChannel;
  propertyTitle?: string | null;
  contactName?: string | null;
}): { draftKind: "whatsapp" | "email" | "none"; payload: DraftPayload; manualReviewRequired: boolean } {
  const name = input.contactName?.trim() || "Hola";
  const prop = input.propertyTitle?.trim();
  const hasContext =
    Boolean(input.normalized.messageBody?.trim()) ||
    Boolean(prop) ||
    input.channel.sourceChannel !== "unknown";

  if (!hasContext) {
    return {
      draftKind: "none",
      payload: {
        manualReviewRequired: true,
        manualReason: "Sin mensaje ni propiedad ni canal claro",
      },
      manualReviewRequired: true,
    };
  }

  const shortProp = prop ? ` sobre ${prop}` : "";
  const nextStep = "¿Te gustaría coordinar una visita o recibir más opciones similares?";

  if (input.channel.sourceChannel === "email") {
    return {
      draftKind: "email",
      payload: {
        email: {
          subject: prop
            ? `Seguimiento de tu consulta${shortProp}`
            : "Seguimiento de tu consulta inmobiliaria",
          body: `${name},\n\nGracias por tu consulta${shortProp}. Te escribimos desde el equipo comercial con información verificada de nuestro inventario.\n\n${nextStep}\n\nSaludos cordiales.`,
          cta: "Respondé a este correo y coordinamos el siguiente paso con un asesor.",
          similarOfferLine: prop
            ? "Podemos enviarte alternativas similares en la misma zona."
            : undefined,
        },
        manualReviewRequired: false,
      },
      manualReviewRequired: false,
    };
  }

  if (input.channel.sourceChannel === "whatsapp" || input.channel.sourceChannel === "portal") {
    const body = `${name}, gracias por tu consulta${shortProp}. Te respondemos desde el equipo comercial. ${nextStep}`;
    return {
      draftKind: "whatsapp",
      payload: {
        whatsapp: {
          body,
          suggestedNextStep: nextStep,
          alternativeNote: prop
            ? "Si preferís, podemos mostrarte propiedades parecidas en precio y zona."
            : undefined,
        },
        manualReviewRequired: false,
      },
      manualReviewRequired: false,
    };
  }

  return {
    draftKind: "none",
    payload: {
      manualReviewRequired: true,
      manualReason: "Canal desconocido; revisión manual recomendada",
    },
    manualReviewRequired: true,
  };
}
