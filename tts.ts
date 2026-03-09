import { GoogleGenAI } from "@google/genai";
import wav from "wav";
import { PassThrough } from "stream";

/**
 * Convert raw PCM audio to WAV buffer
 */
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

/**
 * Generate speech using Gemini TTS
 */
export async function generateTTS(
  text: string,
  apiKey: string
): Promise<string> {

  console.log("Starting TTS...");

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [
      {
        parts: [
          {
            text: `

Aleesya speaks playfully in Mandarin with a warm teasing tone.

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
            voiceName: "Leda"
          }
        }
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts;

const audioPart = parts?.find((p) => p.inlineData);

const data = audioPart?.inlineData?.data;

  if (!data) {
    throw new Error("No audio data returned from Gemini");
  }

  // Convert base64 PCM → Buffer
  const pcmBuffer = Buffer.from(data, "base64");

  // Convert PCM → WAV
  const wavBuffer = await convertPCMToWavBuffer(pcmBuffer);

  // Return base64 WAV for frontend
  return wavBuffer.toString("base64");
}
