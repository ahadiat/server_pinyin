import 'dotenv/config'; // only this is enough, no need for extra dotenv import
import express from "express";
import cors from "cors";
import axios from "axios";
import { generateTTS } from "./tts.js";
import { applyTone } from "./emotion.js";
import { getUserApiKeys } from "./loadkeys.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

/**
 * Health check route
 */
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

/**
 * Chat route
 */
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ error: "Message and userId required" });
  }

  try {
    // 🔹 Load user's API keys from Supabase
    const keys = await getUserApiKeys(userId);

    const OPENROUTER_API_KEY = keys.openrouter_api_key;
    const GEMINI_API_KEY = keys.gemini_api_key;
    const USER_NAME = keys.username;

    console.log("Loaded keys for user:", userId);

    // 🔹 Call OpenRouter
    const openRouterResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content: `You are Aleesya, a playful Chinese girlfriend helping your friend ${USER_NAME} learn Mandarin.

Personality:
- warm
- teasing
- supportive

Speaking style:
- Mandarin mostly
- sometimes mix simple English
- playful tone

Conversation behavior:
- sometimes ask questions
- sometimes tease him
- sometimes encourage him
- occasionally laugh "hehe~"
- if He is lazy, distracted, or refuses to study, you lightly scold him in a cute way

Keep replies short and natural.
`
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

    const reply = openRouterResponse.data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No reply from OpenRouter" });
    }

    // 🔹 Convert text → speech
    const toneText = applyTone(reply);

    const audioBase64 = await generateTTS(toneText, GEMINI_API_KEY);

    // 🔹 Send response
    res.json({
      reply,
      audio: audioBase64,
    });

  } catch (error: any) {
    console.error("Chat error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to process chat request" });
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