import { randomBytes } from "node:crypto";

/** Formato: `kp_<16 hex prefix>_<32 hex secret>` (único por fila vía keyPrefix). */
export const CAPTURE_API_KEY_REGEX = /^kp_([a-f0-9]{16})_([a-f0-9]{32})$/;

export function parseCaptureApiKeyPrefix(token: string): string | null {
  const m = CAPTURE_API_KEY_REGEX.exec(token.trim());
  return m ? m[1] : null;
}

export function generateCaptureApiKeyMaterial(): { keyPrefix: string; raw: string } {
  const keyPrefix = randomBytes(8).toString("hex");
  const secretPart = randomBytes(16).toString("hex");
  const raw = `kp_${keyPrefix}_${secretPart}`;
  return { keyPrefix, raw };
}
