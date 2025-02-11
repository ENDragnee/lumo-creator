import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import sharp from "sharp"
import ffmpeg from "fluent-ffmpeg"

export async function POST(request) {
  const data = await request.formData()
  const file = data.get("file")
  const userId = data.get("userId")

  if (!file) {
    return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `${userId}_${file.name}`
  const filepath = path.join(process.cwd(), "public", "videos", filename)
  const thumbnailPath = path.join(process.cwd(), "public", "thumbnails", `${filename}.jpg`)

  try {
    await writeFile(filepath, buffer)

    // Generate thumbnail
    await new Promise((resolve, reject) => {
      ffmpeg(filepath)
        .screenshots({
          timestamps: ["00:00:01"],
          filename: `${filename}.jpg`,
          folder: path.join(process.cwd(), "public", "thumbnails"),
          size: "320x240",
        })
        .on("end", resolve)
        .on("error", reject)
    })

    // Resize and optimize thumbnail
    await sharp(thumbnailPath)
      .resize(320, 240, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath.replace(".jpg", "_optimized.jpg"))

    return NextResponse.json({
      success: true,
      filename,
      thumbnailUrl: `/thumbnails/${filename}_optimized.jpg`,
    })
  } catch (error) {
    console.error("Error saving file or generating thumbnail:", error)
    return NextResponse.json({ success: false, message: "Error processing video" }, { status: 500 })
  }
}

