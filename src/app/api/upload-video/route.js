import { NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
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
  const tempThumbnailPath = path.join(process.cwd(), "public", "thumbnails", `${filename}_temp.jpg`)
  const finalThumbnailPath = path.join(process.cwd(), "public", "thumbnails", `${filename}.jpg`)

  try {
    await writeFile(filepath, buffer)

    // Generate temporary thumbnail
    await new Promise((resolve, reject) => {
      ffmpeg(filepath)
        .screenshots({
          timestamps: ["00:00:01"],
          filename: `${filename}_temp.jpg`,
          folder: path.join(process.cwd(), "public", "thumbnails"),
          size: "320x240",
        })
        .on("end", resolve)
        .on("error", reject)
    })

    // Optimize thumbnail and save as final version
    await sharp(tempThumbnailPath)
      .resize(320, 240, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(finalThumbnailPath)

    // Remove temporary thumbnail
    await unlink(tempThumbnailPath).catch(() => {})

    return NextResponse.json({
      success: true,
      filename,
      thumbnailUrl: `/thumbnails/${filename}.jpg`,
    })
  } catch (error) {
    console.error("Error saving file or generating thumbnail:", error)
    return NextResponse.json({ success: false, message: "Error processing video" }, { status: 500 })
  }
}