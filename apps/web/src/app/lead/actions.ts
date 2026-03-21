"use server";

import { headers } from "next/headers";
import { createLeadCapture } from "@/domains/capture/services/create-lead-capture";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function submitLeadForm(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  if (process.env.ENABLE_PUBLIC_LEAD_FORM !== "true") {
    return {
      status: "error",
      message:
        "Formulario público desactivado. Define ENABLE_PUBLIC_LEAD_FORM=true en .env para habilitarlo.",
    };
  }

  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot.length > 0) {
    return { status: "idle" };
  }

  const h = headers();
  const ip = getClientIpFromHeaders(h);
  if (!allowRateLimit(`capture-form:${ip}`)) {
    const { windowMs } = getCaptureRateLimitConfig();
    return {
      status: "error",
      message: `Demasiadas solicitudes. Espera unos ${Math.ceil(windowMs / 1000)} segundos e intenta de nuevo.`,
    };
  }

  const accountSlug = String(formData.get("accountSlug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const channelRaw = String(formData.get("channel") ?? "").trim();

  const result = await createLeadCapture({
    accountSlug: accountSlug || undefined,
    email: email || undefined,
    phone: phone || undefined,
    name: name || undefined,
    message: message || undefined,
    channel: channelRaw || undefined,
    source: "public_form",
  });

  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  return {
    status: "success",
    message: "Gracias. Hemos recibido tu solicitud.",
  };
}
