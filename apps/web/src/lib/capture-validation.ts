/**
 * Validación de campos de captura de leads (API + formulario /lead).
 * Sin dependencias externas; alineado a docs/capture-integration.md.
 */

const MAX_NAME_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 8000;

/** Longitud razonable para teléfono tal como lo escribe el usuario (incl. +, espacios). */
const MAX_PHONE_RAW_LENGTH = 40;

/** Dígitos mínimos/máximos tras normalizar (E.164 típico). */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

// Suficiente para MVP; no pretende cubrir todos los TLD nuevos.
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function countPhoneDigits(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

/**
 * @returns mensaje de error en español, o `null` si OK.
 */
export function validateLeadCaptureFields(input: {
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
}): string | null {
  const emailStr = input.email?.trim() || undefined;
  const phoneStr = input.phone?.trim() || undefined;

  if (input.name !== undefined && input.name.length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`;
  }
  if (input.message !== undefined && input.message.length > MAX_MESSAGE_LENGTH) {
    return `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`;
  }

  if (!emailStr && !phoneStr) {
    return "Se requiere al menos email o teléfono";
  }

  if (phoneStr) {
    if (phoneStr.length > MAX_PHONE_RAW_LENGTH) {
      return "Teléfono demasiado largo";
    }
    const digits = countPhoneDigits(phoneStr);
    if (digits < MIN_PHONE_DIGITS || digits > MAX_PHONE_DIGITS) {
      return "Teléfono no válido (revisa el número de dígitos)";
    }
  }

  if (emailStr && !EMAIL_RE.test(emailStr)) {
    return "Email no válido";
  }

  return null;
}
