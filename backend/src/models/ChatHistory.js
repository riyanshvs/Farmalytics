import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "hi",
      index: true,
    },
    source: {
      type: String,
      enum: ["llm", "fallback", "frontend-fallback"],
      default: "llm",
    },
    mode: {
      type: String,
      enum: ["grounded_llm", "deterministic_template", "clarifying_question", "fallback_safe"],
      default: "fallback_safe",
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    sourcesUsed: [{
      type: String,
      enum: ["knowledge", "farm", "weather", "alerts", "market", "fallback"],
    }],
    degraded: {
      type: Boolean,
      default: false,
    },
    languageUsed: {
      type: String,
      default: "hi",
    },
    entities: {
      crops: [{ type: String }],
      topics: [{ type: String }],
      locations: [{ type: String }],
      dates: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

chatHistorySchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
