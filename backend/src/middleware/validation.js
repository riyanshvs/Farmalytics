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

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export const validateFarmInput = (req, res, next) => {
  const { location, farmSize, selectedCrops, distributions } = req.body || {};

  if (location !== undefined) {
    if (typeof location !== "object" || location === null) {
      return res.status(400).json({ error: "location must be an object." });
    }

    const state = sanitizeText(location.state || "").slice(0, 80);
    const district = sanitizeText(location.district || "").slice(0, 80);
    if (!state || !district) {
      return res.status(400).json({ error: "location.state and location.district are required when location is provided." });
    }
    req.body.location = { state, district };
  }

  if (farmSize !== undefined) {
    const numericSize = Number(farmSize);
    if (!Number.isFinite(numericSize) || numericSize <= 0 || numericSize > 100000) {
      return res.status(400).json({ error: "farmSize must be a number between 0 and 100000." });
    }
    req.body.farmSize = numericSize;
  }

  if (selectedCrops !== undefined) {
    if (!isStringArray(selectedCrops) || selectedCrops.length === 0 || selectedCrops.length > 30) {
      return res.status(400).json({ error: "selectedCrops must be a non-empty array of crop names (max 30)." });
    }

    req.body.selectedCrops = Array.from(
      new Set(
        selectedCrops
          .map((crop) => sanitizeText(crop).slice(0, 60))
          .filter(Boolean)
      )
    );

    if (req.body.selectedCrops.length === 0) {
      return res.status(400).json({ error: "selectedCrops must include at least one valid crop name." });
    }
  }

  if (distributions !== undefined) {
    if (!Array.isArray(distributions) || distributions.length === 0 || distributions.length > 100) {
      return res.status(400).json({ error: "distributions must be a non-empty array (max 100)." });
    }

    const normalized = [];
    for (const item of distributions) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({ error: "Each distribution must be an object with name and area." });
      }

      const name = sanitizeText(item.name || "").slice(0, 60);
      const area = Number(item.area);
      if (!name || !isFiniteNumber(area) || area <= 0 || area > 1000000) {
        return res.status(400).json({ error: "Each distribution requires valid name and area between 0 and 1000000." });
      }

      normalized.push({ name, area });
    }

    req.body.distributions = normalized;
  }

  next();
};

export default {
  sanitizeChatInput,
  validateFeedbackInput,
  validateFarmInput,
};
