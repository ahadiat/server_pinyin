import { GoogleGenAI } from "@google/genai";
import wav from "wav";
import dotenv from "dotenv";
import { PassThrough } from "stream";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const client = new GoogleGenAI({ apiKey });

async function convertPCMToWavBuffer(
  pcmData: Buffer,
  channels: number = 1,
  rate: number = 24000,
  sampleWidth: number = 2
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("finish", () => {
      resolve(Buffer.concat(chunks));
    });
    stream.on("error", reject);

    writer.pipe(stream);
    writer.write(pcmData);
    writer.end();
  });
}

export async function generateTTS(text: string): Promise<string> {
  console.log("Starting TTS...");

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [
      {
        parts: [
          {
            text: `
You are Aleesya, a playful Chinese girlfriend. only speak in mandarin.

Speak naturally and playfully.

${text}
`
          }
        ]
      }
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Zephyr"
          }
        }
      }
    }
  });

  const data =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!data) {
    throw new Error("No audio data returned from Gemini");
  }

  const pcmBuffer = Buffer.from(data, "base64");

  const wavBuffer = await convertPCMToWavBuffer(pcmBuffer);

  return wavBuffer.toString("base64");
}