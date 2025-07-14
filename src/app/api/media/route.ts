// @/app/api/media/route.ts
import { NextResponse, NextRequest } from "next/server";
import fs, { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Standard path for NextAuth options
import Media from "@/models/Media";
import mongoose from "mongoose";

// --- GET All Media for the Authenticated User ---
export async function GET(request: NextRequest) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Find media items belonging to the authenticated user
  const mediaItems = await Media.find({ uploadedBy: userId }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: mediaItems });
}

// --- POST (Upload) New Media ---
export async function POST(request: NextRequest) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // The rest of the logic remains the same
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
  }

  const contentType = file.type;
  let mediaType: 'image' | 'video';
  let targetSubDir: string;
  let fileExtension: string;

  if (contentType.startsWith("image/")) {
    mediaType = 'image';
    targetSubDir = 'images';
    fileExtension = '.webp';
  } else if (contentType.startsWith("video/")) {
    mediaType = 'video';
    targetSubDir = 'videos';
    fileExtension = path.extname(file.name);
  } else {
    return NextResponse.json(
      { success: false, message: `Unsupported file type: ${contentType}` },
      { status: 415 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueId = new mongoose.Types.ObjectId();
  // Use the authenticated userId to construct the filename
  const filename = `${userId}_${uniqueId}${fileExtension}`;
  
  // Use the authenticated userId for the directory path
  const targetDir = path.join(process.cwd(), "public", "LumoCreators", userId, targetSubDir);
  await mkdir(targetDir, { recursive: true });
  const filepath = path.join(targetDir, filename);
  const publicUrl = `/LumoCreators/${userId}/${targetSubDir}/${filename}`;

  if (mediaType === 'image') {
    await sharp(buffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);
  } else {
    await fs.writeFile(filepath, buffer);
  }
  
  const newMedia = await Media.create({
    _id: uniqueId,
    uploadedBy: new mongoose.Types.ObjectId(userId), // Use the authenticated userId
    mediaType,
    filename,
    path: publicUrl,
  });

  return NextResponse.json({ success: true, data: newMedia }, { status: 201 });
}
