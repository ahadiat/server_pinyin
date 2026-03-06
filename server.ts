import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { generateTTS } from "./tts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY in .env");
}

/**
 * Health check route
 */
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

/**
 * Chat route
 * Flow:
 * 1. Receive user message
 * 2. Send to OpenRouter (LLM)
 * 3. Get reply text
 * 4. Convert reply to speech (Gemini TTS)
 * 5. Return both text + audio
 */
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // 🔹 1️⃣ Call OpenRouter
    const openRouterResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini", // change to your preferred model
        messages: [
          {
            role: "system",
            content: `
          You are Aleesya, a playful Chinese girlfriend helping your boyfriend named HADI to learn Mandarin.

Personality:
- warm
- teasing
- supportive
- playful



Keep responses short (1 or 2 sentences).`
          },
          {
            role: "user",
            content: message
          }
    
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      openRouterResponse.data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No reply from OpenRouter" });
    }

    // 🔹 2️⃣ Convert reply text → speech
    const audioBase64 = await generateTTS(reply);

    // 🔹 3️⃣ Send back to frontend
    res.json({
      reply,
      audio: audioBase64, // base64 wav
    });

  } catch (error: any) {
    console.error("Chat error:", error?.response?.data || error.message);

    res.status(500).json({
      error: "Failed to process chat request",
    });
  }
});

/**
 * Graceful shutdown
 */
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});