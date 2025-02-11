import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function DELETE(request) {
  const userId = request.nextUrl.searchParams.get("userId")
  const filename = request.nextUrl.searchParams.get("filename")

  if (!userId || !filename) {
    return NextResponse.json({ success: false, message: "User ID and filename are required" }, { status: 400 })
  }

  const videoPath = path.join(process.cwd(), "public", "videos", filename)
  const thumbnailPath = path.join(process.cwd(), "public", "thumbnails", `${filename.split(".")[0]}_optimized.jpg`)

  try {
    await fs.unlink(videoPath)
    await fs.unlink(thumbnailPath).catch(() => {}) // Ignore if thumbnail doesn't exist

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing video and thumbnail:", error)
    return NextResponse.json({ success: false, message: "Error removing video and thumbnail" }, { status: 500 })
  }
}

