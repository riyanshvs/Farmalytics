import ChatHistory from "../models/ChatHistory.js";

export const getRecentConversationMessages = async ({
  userId,
  conversationId,
  limit = 10,
  dbReady = false,
}) => {
  if (!dbReady || !conversationId) return [];

  const filter = userId ? { userId, conversationId } : { conversationId };

  const rows = await ChatHistory.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.reverse();
};

export const toLLMMessages = (history = []) =>
  history
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role, content: item.message }));

export default {
  getRecentConversationMessages,
  toLLMMessages,
};
