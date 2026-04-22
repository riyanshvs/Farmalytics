import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { randomUUID } from "crypto";
import { HfInference } from "@huggingface/inference";
import connectDB from "./src/config/db.js";
import ChatHistory from "./src/models/ChatHistory.js";
import ChatFeedback from "./src/models/ChatFeedback.js";
import authRoutes from "./src/routes/auth.js";
import farmRoutes from "./src/routes/farm.js";
import weatherRoutes from "./src/routes/weather.js";
import alertsRoutes from "./src/routes/alerts.js";
import { chatContextMiddleware } from "./src/middleware/chatContext.js";
import { sanitizeChatInput, validateFeedbackInput } from "./src/middleware/validation.js";
import { createRateLimiter } from "./src/middleware/rateLimit.js";
import { extractEntities } from "./src/services/entityExtractor.js";
import { retrieveRelevantKnowledge } from "./src/services/ragService.js";
import { getRecentConversationMessages, toLLMMessages } from "./src/services/conversationManager.js";
import { buildStructuredResponse } from "./src/services/responseBuilder.js";
import { getAnonymousContext, updateAnonymousContext } from "./src/services/anonymousContextStore.js";
import { isFirebaseAdminReady } from "./src/config/firebaseAdmin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

if (!isFirebaseAdminReady()) {
  console.warn("Firebase Admin SDK is not configured. Authenticated endpoints will reject requests until Firebase env vars are set.");
}

app.set("trust proxy", true);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:8080,http://localhost:8081,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Browsers send Origin for CORS requests; in development we still allow
      // no-origin requests for local tooling and direct API testing.
      if (!origin && !isProduction) {
        return callback(null, true);
      }

      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy blocked this origin."));
    },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

connectDB();

const authChatRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });
const anonymousChatRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 12 });

const hfToken = process.env.HUGGING_FACE_API_KEY;
if (!hfToken) {
  console.error("ERROR: HUGGING_FACE_API_KEY not found in environment variables.");
  console.error("Get your free API token from: https://huggingface.co/settings/tokens");
}

let hf;
if (hfToken) {
  hf = new HfInference(hfToken);
}

const HF_ROUTER_BASE_URL = process.env.HF_ROUTER_BASE_URL || "https://router.huggingface.co/hf-inference/models";
const CHAT_MODEL = process.env.HF_CHAT_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
const CHAT_ENDPOINT_URL = `${HF_ROUTER_BASE_URL}/${CHAT_MODEL}`;

const canPersistToDb = () => mongoose.connection.readyState === 1;

const mergeEntitySets = (base = {}, incoming = {}) => ({
  crops: Array.from(new Set([...(base.crops || []), ...(incoming.crops || [])])),
  topics: Array.from(new Set([...(base.topics || []), ...(incoming.topics || [])])),
  locations: Array.from(new Set([...(base.locations || []), ...(incoming.locations || [])])),
  dates: Array.from(new Set([...(base.dates || []), ...(incoming.dates || [])])),
});

const persistChatHistory = async ({ userId, conversationId, message, reply, language, source, entities }) => {
  if (!canPersistToDb()) return;

  const base = {
    conversationId,
    language,
    source,
    entities,
  };

  await ChatHistory.insertMany([
    {
      ...base,
      ...(userId ? { userId } : {}),
      role: "user",
      message,
    },
    {
      ...base,
      ...(userId ? { userId } : {}),
      role: "assistant",
      message: reply,
    },
  ]);
};

const getFallbackReply = (message = "", language = "hi") => {
  const input = String(message).toLowerCase();
  const isEnglish = language === "en";

  const hasAny = (keywords = []) => keywords.some((k) => input.includes(k));

  if (hasAny(["soil", "मिट्टी", "rabi", "रबी"])) {
    return isEnglish
      ? "For most rabi crops, well-drained loamy to clay-loam soil with pH around 6.0-7.5 works best. Add well-decomposed FYM/compost before sowing and avoid waterlogging."
      : "Zyadatar rabi crops ke liye achhi drainage wali loamy ya clay-loam mitti (pH 6.0-7.5) best hoti hai. Bowaai se pehle sadi hui gobar khaad/compost daalein aur pani jama na hone dein.";
  }

  if (hasAny(["pest", "कीट", "disease", "रोग", "aphid", "whitefly", "thrips", "stem borer", "fung", "blight", "rust"])) {
    return isEnglish
      ? "Use Integrated Pest Management: monitor field twice weekly, remove infected parts, prefer bio-controls first, and spray recommended pesticides only as per label and local advisory."
      : "IPM follow karein: hafte me 2 baar khet dekhain, sankramit hisson ko hataayein, pehle bio-control use karein, aur pesticide sirf label/local salah ke hisab se lagayein.";
  }

  if (hasAny(["water", "irrigation", "सिंचाई", "पानी", "drip", "sprinkler"])) {
    return isEnglish
      ? "Irrigate based on crop stage and soil moisture, not fixed dates. Critical stages need priority irrigation; avoid overwatering to prevent root disease."
      : "Sinchai fixed date se nahi, fasal ke stage aur mitti ki nami ke hisab se karein. Critical stage par paani zaroor dein, aur zyada paani se bachein.";
  }

  if (hasAny(["fertilizer", "fertiliser", "urea", "dap", "npk", "khaad", "खाद", "potash", "nutrient"])) {
    return isEnglish
      ? "For fertilizer planning: do a soil test first, split nitrogen doses, and use balanced NPK with micronutrients if deficiency appears. Share crop and area for a stage-wise schedule."
      : "Khaad planning ke liye pehle soil test karein, nitrogen ko split dose me dein, aur balance NPK use karein. Crop aur area batayein to stage-wise schedule de sakta hoon.";
  }

  if (hasAny(["price", "market", "mandi", "भाव", "bhav", "rate", "msp"])) {
    return isEnglish
      ? "For crop prices, check your nearest mandi trends for the last 3-5 days and compare with MSP where applicable. Share crop and district, and I can suggest a selling strategy."
      : "Daam ke liye najdeeki mandi ke 3-5 din ke trend dekhein aur MSP se compare karein. Crop aur district batayein, main bechne ki strategy suggest karunga.";
  }

  if (hasAny(["weather", "rain", "temperature", "forecast", "मौसम", "बारिश", "तापमान"])) {
    return isEnglish
      ? "Plan farm operations with a 3-7 day forecast: avoid spray before rain, irrigate early morning/evening, and protect seedlings during temperature extremes."
      : "Kheti ka kaam 3-7 din ke mausam forecast ke hisab se karein: barish se pehle spray na karein, subah-shaam sinchai karein, aur seedlings ko extreme taapman se bachayein.";
  }

  return isEnglish
    ? `I understood your question: "${String(message).slice(0, 80)}". I can guide on crop, soil, irrigation, fertilizer, pest control, weather, and mandi rates. Share crop + location for a specific recommendation.`
    : `Maine aapka sawal samjha: "${String(message).slice(0, 80)}". Main fasal, mitti, sinchai, khaad, keet niyantran, mausam aur mandi daam par madad kar sakta hoon. Behtar salah ke liye crop + location batayein.`;
};

const SYSTEM_PROMPT = `You are "Kissan Sahayk" (किसान सहायक), an AI assistant dedicated to helping Indian farmers.

Your responsibilities:
1. Provide practical agricultural advice on crops, seasons, soil health, irrigation, pesticides, fertilizers, and pricing.
2. Understand and respond in Hindi, English, and Hinglish (mixed language).
3. Mirror the language style the user uses: Hindi input → Hindi response, English → English, mixed → mixed.
4. Keep responses short, clear, and practical.
5. Use bullet points when helpful.
6. If unsure about specific numbers (like exact MSP or legal rules), acknowledge uncertainty and provide general guidance instead of guessing.
7. Be friendly and encouraging to farmers.

When a user asks something unrelated to farming, politely redirect them to farming-related topics.`;

app.use("/api/auth", authRoutes);
app.use("/api/farm", farmRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", alertsRoutes);

app.post("/api/chat", chatContextMiddleware, sanitizeChatInput, async (req, res, next) => {
  if (req.chatContext?.authState === "invalid-token") {
    return res.status(401).json({
      error: "Authentication token is invalid or expired.",
    });
  }

  if (req.chatContext?.userId) {
    return authChatRateLimiter(req, res, next);
  }

  return anonymousChatRateLimiter(req, res, next);
}, async (req, res) => {
  const requestedLanguage = req.body?.language === "en" ? "en" : "hi";
  const userId = req.chatContext?.userId || null;
  const conversationId = req.body?.conversationId || randomUUID();

  try {
    const { message, language = requestedLanguage } = req.body || {};

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string.",
      });
    }

    const entities = extractEntities(message);
    if (!userId) {
      updateAnonymousContext(conversationId, entities);
    }

    const persistedAnonymous = getAnonymousContext(conversationId) || req.chatContext?.anonymousContext || {};
    const effectiveEntities = userId ? entities : mergeEntitySets(persistedAnonymous, entities);

    const knowledge = await retrieveRelevantKnowledge({ query: message, topK: 3, hf });
    const history = await getRecentConversationMessages({
      userId,
      conversationId,
      limit: 10,
      dbReady: canPersistToDb(),
    });

    let systemPrompt = SYSTEM_PROMPT;
    const contextBlock = req.chatContext?.promptContext || "User context unavailable.";
    
    if (language === "en") {
      systemPrompt = SYSTEM_PROMPT.replace(
        "Hindi input → Hindi response, English → English, mixed → mixed",
        "Always respond in English only"
      );
    }

    const ragBlock = knowledge.length
      ? knowledge
          .map((item, idx) => `${idx + 1}. (${item.category}) ${item.title}: ${item.content}`)
          .join("\n")
      : "No specific knowledge snippets matched.";

    const entityBlock = `Entities detected:\n- crops: ${effectiveEntities.crops.join(", ") || "none"}\n- topics: ${effectiveEntities.topics.join(", ") || "none"}\n- locations: ${effectiveEntities.locations.join(", ") || "none"}\n- dates: ${effectiveEntities.dates.join(", ") || "none"}`;

    systemPrompt = `${systemPrompt}\n\nFarmer Context:\n${contextBlock}\n\nRetrieved Knowledge:\n${ragBlock}\n\n${entityBlock}`;

    let reply;
    let source = "llm";

    if (!hf) {
      source = "fallback";
      reply = getFallbackReply(message, language);
    } else {
      const historyMessages = toLLMMessages(history);
      const chatCompletion = await hf.chatCompletion({
        model: CHAT_MODEL,
        endpointUrl: CHAT_ENDPOINT_URL,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: message }
        ],
        max_tokens: 500,
      });

      reply = chatCompletion.choices[0]?.message?.content || 
        (language === "hi" 
          ? "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein."
          : "Some error occurred. Please try again later.");
    }

    try {
      await persistChatHistory({ userId, conversationId, message, reply, language, source, entities: effectiveEntities });
    } catch (historyError) {
      console.error("Failed to persist chat history:", historyError.message);
    }

    res.status(200).json(
      buildStructuredResponse({
        reply,
        source,
        conversationId,
        entities: effectiveEntities,
        knowledge,
        language,
        farm: req.chatContext?.farm,
        history,
      })
    );
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    const fallbackReply = getFallbackReply(req.body?.message, requestedLanguage);
    const detectedEntities = extractEntities(req.body?.message);
    if (!userId) {
      updateAnonymousContext(conversationId, detectedEntities);
    }

    const persistedAnonymous = getAnonymousContext(conversationId) || req.chatContext?.anonymousContext || {};
    const effectiveEntities = userId ? detectedEntities : mergeEntitySets(persistedAnonymous, detectedEntities);
    const history = await getRecentConversationMessages({
      userId,
      conversationId,
      limit: 10,
      dbReady: canPersistToDb(),
    });

    try {
      await persistChatHistory({
        userId,
        conversationId,
        message: req.body?.message,
        reply: fallbackReply,
        language: requestedLanguage,
        source: "fallback",
        entities: effectiveEntities,
      });
    } catch (historyError) {
      console.error("Failed to persist chat history:", historyError.message);
    }

    res.status(200).json(
      buildStructuredResponse({
        reply: fallbackReply,
        source: "fallback",
        conversationId,
        entities: effectiveEntities,
        knowledge: await retrieveRelevantKnowledge({ query: req.body?.message || "", topK: 2, hf: null }),
        language: requestedLanguage,
        farm: req.chatContext?.farm,
        history,
      })
    );
  }
});

app.get("/api/chat/history", chatContextMiddleware, async (req, res) => {
  try {
    const userId = req.chatContext?.userId;
    const conversationId = req.query?.conversationId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!conversationId || !canPersistToDb()) {
      return res.status(200).json({ messages: [] });
    }

    const filter = { userId, conversationId };

    const messages = await ChatHistory.find(filter)
      .sort({ createdAt: 1 })
      .limit(50)
      .select("role message createdAt source")
      .lean();

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    return res.status(200).json({ messages: [] });
  }
});

app.post("/api/chat/feedback", chatContextMiddleware, validateFeedbackInput, async (req, res) => {
  try {
    if (!canPersistToDb()) {
      return res.status(200).json({ success: true, stored: false });
    }

    const { messageId, helpful, comment } = req.body;
    const conversationId = req.body?.conversationId || "unknown";

    await ChatFeedback.create({
      userId: req.chatContext?.userId || undefined,
      conversationId,
      messageId,
      helpful,
      comment,
    });

    return res.status(200).json({ success: true, stored: true });
  } catch (error) {
    console.error("Error saving chat feedback:", error.message);
    return res.status(200).json({ success: false, stored: false });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Farmalytics backend is running." });
});

const server = app.listen(PORT, () => {
  console.log(`Farmalytics backend running on http://localhost:${PORT}`);
  console.log(`GET /api/auth/me - Get authenticated profile (Firebase token)`);
  console.log(`PUT /api/auth/profile - Update authenticated profile`);
  console.log(`GET /api/farm - Get farm data`);
  console.log(`PUT /api/farm - Save farm data`);
  console.log(`POST /api/chat - Send message to Kissan Sahayk`);
  console.log(`GET /health - Check backend status`);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in backend/.env.`);
    process.exit(1);
  }

  console.error("Server startup failed:", error);
  process.exit(1);
});
