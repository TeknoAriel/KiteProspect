/**
 * Adaptador HTTP desacoplado para enviar `lead.qualified` a KiteProp (receptor con HMAC).
 */
import { createHash } from "node:crypto";
import type { LeadQualifiedPayload } from "@/domains/activation/handoff-webhook";
import {
  deterministicOccurredAtIso,
  deterministicEventIdForDedupe,
  resolveHandoffSigningSecretForAccount,
  signHandoffBody,
} from "@/domains/activation/handoff-webhook";
import type { KitepropHandoffClassification } from "./classify-kiteprop-handoff-response";
import { classifyKitepropHandoffResponse } from "./classify-kiteprop-handoff-response";

export type KitepropHandoffSendResult = {
  /** true solo si la respuesta es ACK de contrato (2xx o 409 duplicado). */
  ack: boolean;
  classification: KitepropHandoffClassification;
  httpStatus: number;
  latencyMs: number;
  responseText: string;
  requestBodyJson: string;
  requestBodySha256: string;
  errorMessage?: string;
};

export async function sendLeadQualifiedToKiteprop(input: {
  url: string;
  accountSlug: string;
  payload: Omit<LeadQualifiedPayload, "event_id" | "occurred_at"> & {
    dedupe_key: string;
  };
}): Promise<KitepropHandoffSendResult> {
  const body: LeadQualifiedPayload = {
    ...input.payload,
    event_id: deterministicEventIdForDedupe(input.payload.dedupe_key),
    occurred_at: deterministicOccurredAtIso(input.payload.dedupe_key),
  };

  const json = JSON.stringify(body);
  const requestBodySha256 = createHash("sha256").update(json).digest("hex");
  const secret = resolveHandoffSigningSecretForAccount(input.accountSlug);
  const sig = signHandoffBody(json, secret);

  const started = Date.now();
  let httpStatus = 0;
  let responseText = "";
  let errorMessage: string | undefined;

  try {
    const res = await fetch(input.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kite-Signature": sig,
      },
      body: json,
    });
    httpStatus = res.status;
    responseText = await res.text();
    const latencyMs = Date.now() - started;
    const classification = classifyKitepropHandoffResponse(httpStatus);
    const ack = classification === "ack";
    const errorMessage = ack
      ? undefined
      : classification === "fatal"
        ? `HTTP ${httpStatus}: ${responseText.slice(0, 400)}`
        : `HTTP ${httpStatus} (retry)`;
    return {
      ack,
      classification,
      httpStatus,
      latencyMs,
      responseText: responseText.slice(0, 8000),
      requestBodyJson: json,
      requestBodySha256,
      errorMessage,
    };
  } catch (e) {
    const latencyMs = Date.now() - started;
    errorMessage = e instanceof Error ? e.message : String(e);
    const classification = classifyKitepropHandoffResponse(0);
    return {
      ack: false,
      classification,
      httpStatus: 0,
      latencyMs,
      responseText: "",
      requestBodyJson: json,
      requestBodySha256,
      errorMessage,
    };
  }
}
