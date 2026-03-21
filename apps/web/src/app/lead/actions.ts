"use server";

import { createLeadCapture } from "@/domains/capture/services/create-lead-capture";

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

  const accountSlug = String(formData.get("accountSlug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const result = await createLeadCapture({
    accountSlug: accountSlug || undefined,
    email: email || undefined,
    phone: phone || undefined,
    name: name || undefined,
    message: message || undefined,
    channel: "form",
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
