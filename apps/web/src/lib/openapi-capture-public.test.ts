import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("openapi-capture-v1.yaml (público)", () => {
  it("existe bajo apps/web/public y declara openapi 3.x", () => {
    const p = join(__dirname, "..", "..", "public", "openapi-capture-v1.yaml");
    const s = readFileSync(p, "utf8");
    expect(s).toMatch(/^openapi:\s*3\./m);
    expect(s).toContain("/api/contacts/create");
    expect(s).toContain("/api/contacts/{id}/external");
    expect(s).toContain("/api/contacts/resolve-external");
    expect(s).toContain("/api/contacts/crm-batch-sync");
    expect(s).toContain("getContactExternal");
    expect(s).toContain("postCrmBatchSync");
  });
});
