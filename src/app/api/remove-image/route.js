import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function DELETE(request) {
  const userId = request.nextUrl.searchParams.get("userId")
  const filename = request.nextUrl.searchParams.get("filename")

  if (!userId || !filename) {
    return NextResponse.json({ success: false, message: "User ID and filename are required" }, { status: 400 })
  }

  const imagePath = path.join(process.cwd(), "public", "images", filename)

  try {
    await fs.unlink(imagePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing image:", error)
    return NextResponse.json({ success: false, message: "Error removing image" }, { status: 500 })
  }
}

