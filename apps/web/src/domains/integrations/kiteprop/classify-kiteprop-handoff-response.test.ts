import { describe, expect, it } from "vitest";
import {
  classifyKitepropHandoffResponse,
  isHandoffAck,
} from "./classify-kiteprop-handoff-response";

describe("classifyKitepropHandoffResponse", () => {
  it("200 → ack", () => {
    expect(classifyKitepropHandoffResponse(200)).toBe("ack");
    expect(isHandoffAck("ack")).toBe(true);
  });
  it("409 → ack (dedupe)", () => {
    expect(classifyKitepropHandoffResponse(409)).toBe("ack");
  });
  it("422 → fatal", () => {
    expect(classifyKitepropHandoffResponse(422)).toBe("fatal");
  });
  it("500/503 → retry", () => {
    expect(classifyKitepropHandoffResponse(500)).toBe("retry");
    expect(classifyKitepropHandoffResponse(503)).toBe("retry");
  });
  it("429 → retry", () => {
    expect(classifyKitepropHandoffResponse(429)).toBe("retry");
  });
  it("0 (red) → retry", () => {
    expect(classifyKitepropHandoffResponse(0)).toBe("retry");
  });
  it("400 → fatal", () => {
    expect(classifyKitepropHandoffResponse(400)).toBe("fatal");
  });
});
