import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("permite la portada y bloquea dashboard y api", () => {
    const r = robots();
    expect(r.rules).toBeDefined();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules[0]?.disallow).toEqual(["/dashboard/", "/api/"]);
    expect(rules[0]?.allow).toBe("/");
  });
});
