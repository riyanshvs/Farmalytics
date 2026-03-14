const sanitizeText = (value = "") =>
  String(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const sanitizeChatInput = (req, res, next) => {
  const rawMessage = req.body?.message;
  const rawLanguage = req.body?.language;
  const rawConversationId = req.body?.conversationId;

  const message = sanitizeText(rawMessage || "");
  if (!message || message.length < 2 || message.length > 1200) {
    return res.status(400).json({
      error: "Message must be between 2 and 1200 characters.",
    });
  }

  req.body.message = message;
  req.body.language = rawLanguage === "en" ? "en" : "hi";

  if (typeof rawConversationId === "string") {
    req.body.conversationId = sanitizeText(rawConversationId).slice(0, 120);
  }

  next();
};

export const validateFeedbackInput = (req, res, next) => {
  const { messageId, helpful, comment, conversationId } = req.body || {};

  if (!messageId || typeof messageId !== "string") {
    return res.status(400).json({ error: "messageId is required." });
  }

  if (typeof helpful !== "boolean") {
    return res.status(400).json({ error: "helpful must be true or false." });
  }

  req.body.messageId = sanitizeText(messageId).slice(0, 120);
  req.body.comment = sanitizeText(comment || "").slice(0, 500);
  req.body.conversationId = sanitizeText(conversationId || "").slice(0, 120) || "unknown";
  next();
};

export default {
  sanitizeChatInput,
  validateFeedbackInput,
};
