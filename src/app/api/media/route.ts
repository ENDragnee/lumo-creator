// @/app/api/media/route.ts
import { NextResponse, NextRequest } from "next/server";
import fs, { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import Media from "@/models/Media";
import mongoose from "mongoose";
import { withAuth } from "@/lib/api-handler";

// --- GET All Media for the Authenticated User ---
export const GET = withAuth(async (request, { userId }) => {
  const mediaItems = await Media.find({ uploadedBy: userId }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: mediaItems });
});


// --- POST (Upload) New Media ---
export const POST = withAuth(async (request, { userId }) => {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json(
      { success: false, message: "No file provided" },
      { status: 400 }
    );
  }

  // Middleware Action: Validate Content-Type and determine media type
  const contentType = file.type;
  let mediaType: 'image' | 'video';
  let targetSubDir: string;
  let fileExtension: string;

  if (contentType.startsWith("image/")) {
    mediaType = 'image';
    targetSubDir = 'images';
    fileExtension = '.webp'; // Standardize to webp for optimization
  } else if (contentType.startsWith("video/")) {
    mediaType = 'video';
    targetSubDir = 'videos';
    fileExtension = path.extname(file.name);
  } else {
    return NextResponse.json(
      { success: false, message: `Unsupported file type: ${contentType}` },
      { status: 415 } // 415 Unsupported Media Type
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Use a unique name to prevent collisions
  const uniqueId = new mongoose.Types.ObjectId();
  const filename = `${userId}_${uniqueId}${fileExtension}`;
  
  const targetDir = path.join(process.cwd(), "public", "LumoCreators", userId, targetSubDir);
  await mkdir(targetDir, { recursive: true });
  const filepath = path.join(targetDir, filename);
  const publicUrl = `/LumoCreators/${userId}/${targetSubDir}/${filename}`;

  // Middleware Action: Process file based on its type
  if (mediaType === 'image') {
    await sharp(buffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);
  } else { // For video
    await fs.writeFile(filepath, buffer);
  }
  
  // Create the record in the database
  const newMedia = await Media.create({
    _id: uniqueId,
    uploadedBy: new mongoose.Types.ObjectId(userId),
    mediaType,
    filename,
    path: publicUrl,
  });

  return NextResponse.json({ success: true, data: newMedia }, { status: 201 });
});
