import { randomBytes } from "node:crypto";

/** Secreto mostrado una vez al crear la suscripción; el receptor valida el HMAC del cuerpo. */
export function generateWebhookSigningSecret(): string {
  return `kws_${randomBytes(24).toString("hex")}`;
}
