import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import farmRoutes from "./src/routes/farm.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

const hfToken = process.env.HUGGING_FACE_API_KEY;
if (!hfToken) {
  console.error("ERROR: HUGGING_FACE_API_KEY not found in environment variables.");
  console.error("Get your free API token from: https://huggingface.co/settings/tokens");
}

let hf;
if (hfToken) {
  hf = new HfInference(hfToken);
}

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

app.post("/api/chat", async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string.",
      });
    }

    let systemPrompt = SYSTEM_PROMPT;
    
    if (language === "en") {
      systemPrompt = SYSTEM_PROMPT.replace(
        "Hindi input → Hindi response, English → English, mixed → mixed",
        "Always respond in English only"
      );
    }

    if (!hf) {
      return res.status(503).json({
        reply: language === "hi" 
          ? "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein."
          : "Some error occurred. Please try again later.",
      });
    }

    const chatCompletion = await hf.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 
      (language === "hi" 
        ? "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein."
        : "Some error occurred. Please try again later.");

    res.json({ reply });
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    res.status(500).json({
      reply: language === "hi"
        ? "Kuch dikkat aa rahi hai. Kripya thodi der baad try karein."
        : "Some error occurred. Please try again later.",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Farmalytics backend is running." });
});

app.listen(PORT, () => {
  console.log(`Farmalytics backend running on http://localhost:${PORT}`);
  console.log(`POST /api/auth/send-otp - Send OTP`);
  console.log(`POST /api/auth/verify-otp - Verify OTP & login`);
  console.log(`GET /api/farm - Get farm data`);
  console.log(`PUT /api/farm - Save farm data`);
  console.log(`POST /api/chat - Send message to Kissan Sahayk`);
  console.log(`GET /health - Check backend status`);
});
