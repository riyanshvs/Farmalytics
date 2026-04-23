import mongoose from "mongoose";

const chatFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: false,
    },
    conversationId: {
      type: String,
      index: true,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    helpful: {
      type: Boolean,
      required: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    mode: {
      type: String,
      default: "",
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    sourcesUsed: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

chatFeedbackSchema.index({ conversationId: 1, messageId: 1 });

const ChatFeedback = mongoose.model("ChatFeedback", chatFeedbackSchema);

export default ChatFeedback;
