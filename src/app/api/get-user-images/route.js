import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
  }

  const imagesDir = path.join(process.cwd(), "public", "LumoCreators", String(userId), "images")

  try {
    const files = await fs.readdir(imagesDir)
    const userImages = files
      .filter((file) => file.startsWith(`${userId}_`))
      .map((file) => ({
        filename: file,
        imageUrl: `/LumoCreators/${userId}/images/${file}`,
      }))

    return NextResponse.json({ success: true, images: userImages })
  } catch (error) {
    console.error("Error reading images directory:", error)
    return NextResponse.json({ success: false, message: "Error fetching images" }, { status: 500 })
  }
}

