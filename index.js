import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'; 

// Initialize the client
const ai = new GoogleGenAI();

async function streamText() {
  try {
    // 1. Call the streaming API endpoint
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash", 
      contents: "Write a short poem about Somalia.",
    });

    console.log("Gemini Streaming Response:\n");

    // 2. Iterate over the stream chunks as they arrive from Google
    for await (const chunk of responseStream) {
      // Use process.stdout.write to print text side-by-side without automatic newlines
      process.stdout.write(chunk.text);
    }
    
    console.log("\n\n--- Stream Finished ---");

  } catch (error) {
    console.error("Error during streaming:", error);
  }
}

streamText();
