

import * as fs from "node:fs";

async function generateImage() {
  const prompt = encodeURIComponent("A man wearing suit");
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`;

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync("free_image.jpg", buffer);
  console.log("Image generated and saved!");
}

generateImage();