import * as fs from "node:fs"

async function generateFreeImage() {
    const prompt = encodeURIComponent("ronaldo wearing suit")
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`

    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync("image.jpg", buffer)
    console.log("Image generated and saved!")
}

generateFreeImage()