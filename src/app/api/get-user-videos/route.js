import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
  }

  // Construct paths relative to the project root
  const publicDir = path.join(process.cwd(), "public");
  const videosDir = path.join(publicDir, "LumoCreators", userId, "videos");
  const thumbnailsDir = path.join(videosDir, "thumbnails");

  try {
    const files = await fs.readdir(videosDir);
    const userVideos = [];

    for (const file of files) {
      if (file.startsWith(`${userId}_`)) {
        const thumbnailFile = `${file}.jpg`; // e.g., "userId_video.mp4.jpg"
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFile);

        // Check if thumbnail exists
        let thumbnailUrl;
        try {
          await fs.access(thumbnailPath);
          thumbnailUrl = `/LumoCreators/${userId}/videos/thumbnails/${thumbnailFile}`;
        } catch (error) {
          thumbnailUrl = "/placeholder-thumbnail.jpg"; // Assumes placeholder is in public/
        }

        userVideos.push({
          filename: file,
          videoUrl: `/LumoCreators/${userId}/videos/${file}`,
          thumbnailUrl,
        });
      }
    }

    return NextResponse.json({ success: true, videos: userVideos });
  } catch (error) {
    console.error("Error reading videos directory:", error);
    return NextResponse.json({ success: false, message: "Error fetching videos" }, { status: 500 });
  }
}