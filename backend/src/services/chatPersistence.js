import ChatHistory from "../models/ChatHistory.js";

export const mergeEntitySets = (base = {}, incoming = {}) => ({
  crops: Array.from(new Set([...(base.crops || []), ...(incoming.crops || [])])),
  topics: Array.from(new Set([...(base.topics || []), ...(incoming.topics || [])])),
  locations: Array.from(new Set([...(base.locations || []), ...(incoming.locations || [])])),
  dates: Array.from(new Set([...(base.dates || []), ...(incoming.dates || [])])),
});

export const persistChatExchange = async ({
  dbReady = false,
  userId,
  conversationId,
  message,
  reply,
  language,
  source,
  entities,
  assistantMeta = {},
}) => {
  if (!dbReady) return;

  const base = {
    conversationId,
    language,
    source,
    entities,
    ...(userId ? { userId } : {}),
  };

  await ChatHistory.insertMany([
    {
      ...base,
      role: "user",
      message,
    },
    {
      ...base,
      role: "assistant",
      message: reply,
      mode: assistantMeta.mode || "fallback_safe",
      confidence: assistantMeta.confidence ?? 0,
      sourcesUsed: assistantMeta.sourcesUsed || [],
      degraded: Boolean(assistantMeta.degraded),
      languageUsed: assistantMeta.languageUsed || language,
    },
  ]);
};

export default {
  mergeEntitySets,
  persistChatExchange,
};
