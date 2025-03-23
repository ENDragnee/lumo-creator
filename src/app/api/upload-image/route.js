import { NextResponse } from "next/server";
import path from "path";
import sharp from "sharp";
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

  // Create the target directory: /public/LumoCreators/<UserID>/images
  const targetDir = path.join(process.cwd(), "public", "LumoCreators", String(userId), "images");
  await mkdir(targetDir, { recursive: true });
  const filepath = path.join(targetDir, filename);

  try {
    await sharp(buffer)
      .resize(800, 600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filepath);

      await Media.create({
        uploadedBy: new mongoose.Types.ObjectId(userId),
        mediaType: "image",
        filename,
        url: `/LumoCreators/${userId}/images/${filename}`,
      });
  

    return NextResponse.json({
      success: true,
      filename,
      imageUrl: `/LumoCreators/${userId}/images/${filename}`,
    });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { success: false, message: "Error processing image" },
      { status: 500 }
    );
  }
}
