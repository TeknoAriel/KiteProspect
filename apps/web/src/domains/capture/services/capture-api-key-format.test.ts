import { describe, expect, it } from "vitest";
import { CAPTURE_API_KEY_REGEX, generateCaptureApiKeyMaterial, parseCaptureApiKeyPrefix } from "./capture-api-key-format";

describe("capture-api-key-format", () => {
  it("genera y parsea prefix", () => {
    const { keyPrefix, raw } = generateCaptureApiKeyMaterial();
    expect(CAPTURE_API_KEY_REGEX.test(raw)).toBe(true);
    expect(parseCaptureApiKeyPrefix(raw)).toBe(keyPrefix);
  });

  it("rechaza token inválido", () => {
    expect(parseCaptureApiKeyPrefix("Bearer xyz")).toBe(null);
  });
});
