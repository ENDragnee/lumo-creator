import {  NextResponse } from "next/server"
import path from "path"
import sharp from "sharp"

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
  const filepath = path.join(process.cwd(), "public", "images", filename)

  try {
    // Optimize and save the image
    await sharp(buffer)
      .resize(800, 600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filepath)

    return NextResponse.json({
      success: true,
      filename,
      imageUrl: `/images/${filename}`,
    })
  } catch (error) {
    console.error("Error saving file:", error)
    return NextResponse.json({ success: false, message: "Error processing image" }, { status: 500 })
  }
}

