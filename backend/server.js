import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY not found in environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// System prompt for Kissan Sahayk
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

// POST /api/chat - Handle chat messages
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string.",
      });
    }

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + message }],
        },
      ],
    });

    const reply =
      result.response.text() ||
      "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein.";

    res.json({ reply });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({
      reply: "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein.",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Kissan Sahayk backend is running." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Kissan Sahayk backend running on http://localhost:${PORT}`);
  console.log(`POST /api/chat - Send a message to Kissan Sahayk`);
  console.log(`GET /health - Check backend status`);
});
