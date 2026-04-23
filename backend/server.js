import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { randomUUID } from "crypto";
import connectDB from "./src/config/db.js";
import ChatHistory from "./src/models/ChatHistory.js";
import ChatFeedback from "./src/models/ChatFeedback.js";
import authRoutes from "./src/routes/auth.js";
import farmRoutes from "./src/routes/farm.js";
import weatherRoutes from "./src/routes/weather.js";
import alertsRoutes from "./src/routes/alerts.js";
import newsRoutes from "./src/routes/news.js";
import marketRoutes from "./src/routes/market.js";
import { chatContextMiddleware } from "./src/middleware/chatContext.js";
import { sanitizeChatInput, validateFeedbackInput } from "./src/middleware/validation.js";
import { createRateLimiter } from "./src/middleware/rateLimit.js";
import { extractEntities } from "./src/services/entityExtractor.js";
import { getRecentConversationMessages, toLLMMessages } from "./src/services/conversationManager.js";
import { buildStructuredResponse } from "./src/services/responseBuilder.js";
import { getAnonymousContext, updateAnonymousContext } from "./src/services/anonymousContextStore.js";
import { createHuggingFaceChatProvider } from "./src/services/chatProvider.js";
import { buildLiveContext } from "./src/services/liveContextService.js";
import { buildChatResponse } from "./src/services/chatOrchestrator.js";
import { mergeEntitySets, persistChatExchange } from "./src/services/chatPersistence.js";
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
const chatProvider = createHuggingFaceChatProvider();

if (!chatProvider.configured) {
  console.error("ERROR: HUGGING_FACE_API_KEY not found in environment variables.");
  console.error("Get your free API token from: https://huggingface.co/settings/tokens");
}

const canPersistToDb = () => mongoose.connection.readyState === 1;

app.use("/api/auth", authRoutes);
app.use("/api/farm", farmRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/market", marketRoutes);

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

    const history = await getRecentConversationMessages({
      userId,
      conversationId,
      limit: 10,
      dbReady: canPersistToDb(),
    });

    const liveContext = await buildLiveContext({
      farm: req.chatContext?.farm,
      primaryIntent: null,
      entities: effectiveEntities,
    });

    const result = await buildChatResponse({
      message,
      requestedLanguage: language,
      conversationId,
      entities: effectiveEntities,
      history: toLLMMessages(history),
      chatContext: req.chatContext,
      provider: chatProvider,
      liveContext,
    });

    try {
      await persistChatExchange({
        dbReady: canPersistToDb(),
        userId,
        conversationId,
        message,
        reply: result.reply,
        language,
        source: result.source,
        entities: effectiveEntities,
        assistantMeta: {
          mode: result.mode,
          confidence: result.confidence,
          sourcesUsed: result.sourcesUsed,
          degraded: result.degraded,
          languageUsed: result.languageUsed,
        },
      });
    } catch (historyError) {
      console.error("Failed to persist chat history:", historyError.message);
    }

    return res.status(200).json(
      buildStructuredResponse({
        reply: result.reply,
        source: result.source,
        conversationId,
        entities: effectiveEntities,
        knowledge: result.knowledge,
        language,
        farm: req.chatContext?.farm,
        history,
        mode: result.mode,
        confidence: result.confidence,
        degraded: result.degraded,
        sourcesUsed: result.sourcesUsed,
        languageUsed: result.languageUsed,
        quickReplyContext: result.quickReplyContext,
      })
    );
  } catch (error) {
    console.error("Error building chat response:", error);

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

    const fallbackResult = await buildChatResponse({
      message: req.body?.message || "",
      requestedLanguage,
      conversationId,
      entities: effectiveEntities,
      history: toLLMMessages(history),
      chatContext: req.chatContext,
      provider: { configured: false },
      liveContext: await buildLiveContext({
        farm: req.chatContext?.farm,
        primaryIntent: null,
        entities: effectiveEntities,
      }),
    });

    try {
      await persistChatExchange({
        dbReady: canPersistToDb(),
        userId,
        conversationId,
        message: req.body?.message,
        reply: fallbackResult.reply,
        language: requestedLanguage,
        source: fallbackResult.source,
        entities: effectiveEntities,
        assistantMeta: {
          mode: fallbackResult.mode,
          confidence: fallbackResult.confidence,
          sourcesUsed: fallbackResult.sourcesUsed,
          degraded: fallbackResult.degraded,
          languageUsed: fallbackResult.languageUsed,
        },
      });
    } catch (historyError) {
      console.error("Failed to persist chat history:", historyError.message);
    }

    return res.status(200).json(
      buildStructuredResponse({
        reply: fallbackResult.reply,
        source: fallbackResult.source,
        degraded: true,
        conversationId,
        entities: effectiveEntities,
        knowledge: fallbackResult.knowledge,
        language: requestedLanguage,
        farm: req.chatContext?.farm,
        history,
        mode: fallbackResult.mode,
        confidence: fallbackResult.confidence,
        sourcesUsed: fallbackResult.sourcesUsed,
        languageUsed: fallbackResult.languageUsed,
        quickReplyContext: fallbackResult.quickReplyContext,
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
      .select("role message createdAt source mode confidence sourcesUsed degraded languageUsed")
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

    const { messageId, helpful, comment, mode, confidence, sourcesUsed } = req.body;
    const conversationId = req.body?.conversationId || "unknown";

    await ChatFeedback.create({
      userId: req.chatContext?.userId || undefined,
      conversationId,
      messageId,
      helpful,
      comment,
      mode,
      confidence,
      sourcesUsed: Array.isArray(sourcesUsed) ? sourcesUsed : [],
    });

    return res.status(200).json({ success: true, stored: true });
  } catch (error) {
    console.error("Error saving chat feedback:", error.message);
    return res.status(200).json({ success: false, stored: false });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Farmalytics backend is running.",
    dependencies: {
      mongo: {
        readyState: mongoose.connection.readyState,
        connected: mongoose.connection.readyState === 1,
      },
      firebaseAdminConfigured: isFirebaseAdminReady(),
      huggingFaceConfigured: chatProvider.configured,
    },
  });
});

const server = app.listen(PORT, () => {
  console.log(`Farmalytics backend running on http://localhost:${PORT}`);
  console.log(`GET /api/auth/me - Get authenticated profile (Firebase token)`);
  console.log(`PUT /api/auth/profile - Update authenticated profile`);
  console.log(`GET /api/farm - Get farm data`);
  console.log(`PUT /api/farm - Save farm data`);
  console.log(`GET /api/news - Get agriculture news feed`);
  console.log(`GET /api/market - Get live mandi price feed`);
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
