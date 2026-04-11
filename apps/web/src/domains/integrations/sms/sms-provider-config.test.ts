import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getConfiguredSmsProvider } from "./sms-provider-config";

describe("getConfiguredSmsProvider", () => {
  let backup: string | undefined;

  beforeEach(() => {
    backup = process.env.SMS_PROVIDER;
  });

  afterEach(() => {
    if (backup === undefined) {
      delete process.env.SMS_PROVIDER;
    } else {
      process.env.SMS_PROVIDER = backup;
    }
  });

  it("default twilio si SMS_PROVIDER no está definido", () => {
    delete process.env.SMS_PROVIDER;
    expect(getConfiguredSmsProvider()).toBe("twilio");
  });

  it("telnyx cuando SMS_PROVIDER=telnyx", () => {
    process.env.SMS_PROVIDER = "telnyx";
    expect(getConfiguredSmsProvider()).toBe("telnyx");
  });
});
