/**
 * Clasificación de respuesta HTTP del receptor KiteProp (contrato lead.qualified).
 * - `ack`: transición local a handed_off permitida (2xx o 409 duplicado).
 * - `retry`: reintento BullMQ (5xx, 429, red/timeout).
 * - `fatal`: sin reintento (422 validación, 4xx operativos, etc.).
 */
export type KitepropHandoffClassification = "ack" | "retry" | "fatal";

export function classifyKitepropHandoffResponse(
  httpStatus: number,
): KitepropHandoffClassification {
  if (httpStatus >= 200 && httpStatus < 300) {
    return "ack";
  }
  if (httpStatus === 409) {
    return "ack";
  }
  if (httpStatus === 422) {
    return "fatal";
  }
  if (httpStatus === 429 || httpStatus >= 500) {
    return "retry";
  }
  if (httpStatus === 0) {
    return "retry";
  }
  return "fatal";
}

export function isHandoffAck(classification: KitepropHandoffClassification): boolean {
  return classification === "ack";
}
