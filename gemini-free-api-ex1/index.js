import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'; // Loads GEMINI_API_KEY from .env
import readline from 'readline';

const ai = new GoogleGenAI();
const MODEL_NAME = "gemini-3.6-flash";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  try {

    console.log("=== AI Blog Assistant ===");
    const topic = await askQuestion("\nEnter a blog post topic: ");
    
    if (!topic.trim()) {
      console.log("Topic cannot be empty. Exiting.");
      rl.close();
      return;
    }

    console.log(`\nGenerating outline for: "${topic}"...\n`);
    
    const outlineStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: `Create a comprehensive, well-structured blog post outline for the topic: "${topic}".`,
    });

    let fullOutlineText = "";
    for await (const chunk of outlineStream) {
      process.stdout.write(chunk.text);
      fullOutlineText += chunk.text; 
    }
    console.log("\n\n--- Outline Generation Complete ---");

 
    console.log("\nCreating a 2-sentence summary of this outline...");
    const summaryResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Summarize the following blog post outline in exactly two sentences:\n\n${fullOutlineText}`,
    });
    console.log(`\nSummary:\n${summaryResponse.text.trim()}\n`);

    console.log("--- Chat Session Started ---");
    console.log("You can now ask follow-up questions about this topic. Type 'exit' to quit.\n");


    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: [
        { role: "user", parts: [{ text: `I want to write a blog post about: ${topic}` }] },
        { role: "model", parts: [{ text: `Great! Here is the outline we generated:\n${fullOutlineText}` }] }
      ]
    });

    while (true) {
      const followUp = await askQuestion("You: ");
      
      if (followUp.toLowerCase() === 'exit') {
        console.log("\nGoodbye!");
        break;
      }

      if (!followUp.trim()) continue;

      process.stdout.write("\nGemini: ");
      

      const chatStream = await chat.sendMessageStream({ message: followUp });
      
      for await (const chunk of chatStream) {
        process.stdout.write(chunk.text);
      }
      console.log("\n");
    }

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

main();
