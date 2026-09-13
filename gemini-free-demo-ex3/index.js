import * as googleTTS from "google-tts-api";
import * as fs from "node:fs";

async function generateSpeech() {
    const text = "Hello. Miss nafyar how are you doing today? I hope you are doing well";

    const base64Audio = await googleTTS.getAudioBase64(text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
        timeout: 15000,
    });

    const buffer = Buffer.from(base64Audio, "base64");
    fs.writeFileSync("nafyar.mp3", buffer);

    console.log("Audio saved successfully as travel.mp3!");
}

generateSpeech();
