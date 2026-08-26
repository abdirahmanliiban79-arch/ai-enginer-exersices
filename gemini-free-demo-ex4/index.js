import { DeepgramClient } from "@deepgram/sdk";
import * as fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error("Error: DEEPGRAM_API_KEY is not defined in .env");
  process.exit(1);
}

const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });

async function transcribeLocalAudio(filePath) {
  try {
    console.log(`Processing audio file: ${filePath}...`);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File "${filePath}" not found.`);
      return;
    }

  
    const audioBuffer = fs.readFileSync(filePath);

    const response = await deepgram.listen.v1.media.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
        language: "en",
      }
    );

    const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    console.log("\n--- Transcribed Text ---");
    console.log(transcript || "No transcript found.");
    console.log("------------------------\n");

  } catch (err) {
    console.error("Error transcribing audio file:", err.message || err);
  }
}


transcribeLocalAudio("./travel.mp3");
