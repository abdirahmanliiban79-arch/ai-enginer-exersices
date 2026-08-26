import * as googleTTS from "google-tts-api";
import * as fs from "node:fs";

async function generateSpeech() {
    const text = "Hello Travel is a classroom without walls and a teacher without a book.When we visit a new place, we see how other people live, eat, and laugh.";

    const base64Audio = await googleTTS.getAudioBase64(text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
        timeout: 15000,
    });

    const buffer = Buffer.from(base64Audio, "base64");
    fs.writeFileSync("travel.mp3", buffer);

    console.log("Audio saved successfully as travel.mp3!");
}

generateSpeech();
