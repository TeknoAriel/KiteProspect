import type { Prisma } from "@kite-prospect/db";

/** Claves en `Account.config` (JSON) para el motor conversacional. */
export type AccountAiPromptConfig = {
  aiConversationPromptVersion?: string;
  aiConversationSystemPromptAppend?: string;
};

const MAX_VERSION_LEN = 120;
const MAX_APPEND_LEN = 4000;

function asRecord(config: unknown): Record<string, unknown> {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

export function extractAiPromptFromAccountConfig(
  config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
): AccountAiPromptConfig {
  const o = asRecord(config ?? null);
  const version = o.aiConversationPromptVersion;
  const append = o.aiConversationSystemPromptAppend;
  return {
    aiConversationPromptVersion:
      typeof version === "string" ? version.slice(0, MAX_VERSION_LEN) : undefined,
    aiConversationSystemPromptAppend:
      typeof append === "string" ? append.slice(0, MAX_APPEND_LEN) : undefined,
  };
}

export type AiPromptConfigPatch = {
  aiConversationPromptVersion?: string | null;
  aiConversationSystemPromptAppend?: string | null;
};

export function mergeAiPromptIntoAccountConfig(
  existing: Prisma.JsonValue | null | undefined,
  patch: AiPromptConfigPatch,
): Prisma.InputJsonValue {
  const next = asRecord(existing ?? null);

  if (patch.aiConversationPromptVersion !== undefined) {
    const v = patch.aiConversationPromptVersion?.trim();
    if (!v) {
      delete next.aiConversationPromptVersion;
    } else {
      next.aiConversationPromptVersion = v.slice(0, MAX_VERSION_LEN);
    }
  }

  if (patch.aiConversationSystemPromptAppend !== undefined) {
    const a = patch.aiConversationSystemPromptAppend?.trim();
    if (!a) {
      delete next.aiConversationSystemPromptAppend;
    } else {
      next.aiConversationSystemPromptAppend = a.slice(0, MAX_APPEND_LEN);
    }
  }

  return next as Prisma.InputJsonValue;
}
