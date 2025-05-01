import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { mkdir } from "fs/promises";
import Media from "@/models/Media";
import mongoose from "mongoose";

export async function POST(request) {
  const data = await request.formData();
  const file = data.get("file");
  const userId = data.get("userId");

  if (!file) {
    return NextResponse.json(
      { success: false, message: "No file uploaded" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${userId}_${file.name}`;

  // Create the target directories
  const videoDir = path.join(process.cwd(), "public", "LumoCreators", String(userId), "videos");
  await mkdir(videoDir, { recursive: true });
  const filepath = path.join(videoDir, filename);

  const thumbnailDir = path.join(process.cwd(), "public", "LumoCreators", String(userId), "videos" ,"thumbnails");
  await mkdir(thumbnailDir, { recursive: true });
  const tempThumbnailPath = path.join(thumbnailDir, `${filename}_temp.jpg`);
  const finalThumbnailPath = path.join(thumbnailDir, `${filename}.jpg`);

  try {
    await writeFile(filepath, buffer);

    // Generate a temporary thumbnail using ffmpeg.
    await new Promise((resolve, reject) => {
      ffmpeg(filepath)
        .screenshots({
          timestamps: ["00:00:01"],
          filename: `${filename}_temp.jpg`,
          folder: thumbnailDir,
          size: "320x240",
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Optimize the temporary thumbnail and save as the final version.
    await sharp(tempThumbnailPath)
      .resize(320, 240, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(finalThumbnailPath);

    // Remove the temporary thumbnail.
    await unlink(tempThumbnailPath).catch(() => {});

      // Create a document in the Media collection for the video upload.
      await Media.create({
        uploadedBy: new mongoose.Types.ObjectId(userId),
        mediaType: "video",
        filename,
        url: `/LumoCreators/${userId}/videos/${filename}`,
        thumbnailUrl: `/LumoCreators/${userId}/videos/thumbnails/${filename}.jpg`,
      });

    return NextResponse.json({
      success: true,
      filename,
      thumbnailUrl: `/LumoCreators/${userId}/thumbnails/${filename}.jpg`,
    });
  } catch (error) {
    console.error("Error saving file or generating thumbnail:", error);
    return NextResponse.json(
      { success: false, message: "Error processing video" },
      { status: 500 }
    );
  }
}
