import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
  }

  const videosDir = path.join(process.cwd(), "public", "videos")
  const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")

  try {
    const files = await fs.readdir(videosDir)
    const userVideos = []

    for (const file of files) {
      if (file.startsWith(`${userId}_`)) {
        const thumbnailFile = `${file}.jpg`
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFile)

        // Check if thumbnail exists
        try {
          await fs.access(thumbnailPath)
          userVideos.push({
            filename: file,
            thumbnailUrl: `/thumbnails/${thumbnailFile}`,
          })
        } catch (error) {
          // If thumbnail doesn't exist, use a placeholder
          userVideos.push({
            filename: file,
            thumbnailUrl: "/placeholder-thumbnail.jpg",
          })
        }
      }
    }

    return NextResponse.json({ success: true, videos: userVideos })
  } catch (error) {
    console.error("Error reading videos directory:", error)
    return NextResponse.json({ success: false, message: "Error fetching videos" }, { status: 500 })
  }
}

