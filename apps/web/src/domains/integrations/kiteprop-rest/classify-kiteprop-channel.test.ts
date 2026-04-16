import { describe, expect, it } from "vitest";
import { classifyKitepropChannel, toConversationChannel } from "./classify-kiteprop-channel";

describe("classifyKitepropChannel", () => {
  it("whatsapp", () => {
    const c = classifyKitepropChannel({ channelRaw: "whatsapp" });
    expect(c.sourceChannel).toBe("whatsapp");
    expect(toConversationChannel(c.sourceChannel)).toBe("whatsapp");
  });

  it("email", () => {
    const c = classifyKitepropChannel({ channelRaw: "email" });
    expect(c.sourceChannel).toBe("email");
  });

  it("desconocido", () => {
    const c = classifyKitepropChannel({});
    expect(c.sourceChannel).toBe("unknown");
  });
});
