import { describe, expect, it } from "vitest";
import { metaFieldValue, tryParseMetaLeadWebhook } from "./parse-meta-lead-webhook";

describe("tryParseMetaLeadWebhook", () => {
  it("parsea leadgen típico", () => {
    const parsed = tryParseMetaLeadWebhook({
      object: "page",
      entry: [
        {
          id: "PAGE123",
          changes: [
            {
              field: "leadgen",
              value: {
                leadgen_id: "LG1",
                field_data: [
                  { name: "email", values: ["a@b.com"] },
                  { name: "phone_number", values: ["+5491112345678"] },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(parsed?.pageId).toBe("PAGE123");
    expect(parsed?.leadgenId).toBe("LG1");
    expect(metaFieldValue(parsed!.fieldData, "email")).toBe("a@b.com");
  });
});
