// @/app/api/media/route.ts
import { NextResponse, NextRequest } from "next/server";
import fs, { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Media from "@/models/Media";
import mongoose from "mongoose";

const MAX_IMAGES_PER_USER = 20;

// --- GET All Media with Filtering ---
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const limit = searchParams.get('limit');

    // Build the query object
    const query: { uploadedBy: mongoose.Types.ObjectId; tag?: { $regex: string; $options: 'i' } } = {
        uploadedBy: userId
    };

    if (tag) {
        // Use regex for partial, case-insensitive tag matching
        query.tag = { $regex: tag, $options: 'i' };
    }

    try {
        let mediaQuery = Media.find(query).sort({ createdAt: -1 });

        if (limit && !isNaN(parseInt(limit))) {
            mediaQuery = mediaQuery.limit(parseInt(limit));
        }

        const mediaItems = await mediaQuery.exec();
        return NextResponse.json({ success: true, data: mediaItems });

    } catch (error) {
        console.error("Error fetching media:", error);
        return NextResponse.json({ success: false, message: "Server error while fetching media." }, { status: 500 });
    }
}

// --- POST (Upload) New Media with Limit Enforcement ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const tag: string | null = data.get("tag") as string; // Get the tag from form data

    if (!file) {
        return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // --- ENFORCE 20 IMAGE LIMIT ---
    try {
        const imageCount = await Media.countDocuments({ uploadedBy: userId, mediaType: 'image' });

        if (imageCount >= MAX_IMAGES_PER_USER) {
            // Find the oldest image for this user
            const oldestImage = await Media.findOne({ uploadedBy: userId, mediaType: 'image' }).sort({ createdAt: 1 });

            if (oldestImage) {
                // 1. Delete the physical file
                const filePathOnServer = path.join(process.cwd(), "public", oldestImage.path);
                try {
                    await fs.unlink(filePathOnServer);
                } catch (unlinkError: any) {
                    // Log the error but continue, as the DB record is more important to remove
                    console.warn(`Could not delete old file from disk: ${filePathOnServer}`, unlinkError.message);
                }
                
                // 2. Delete the database record
                await Media.findByIdAndDelete(oldestImage._id);
            }
        }
    } catch (error) {
        console.error("Error enforcing media limit:", error);
        return NextResponse.json({ success: false, message: "Server error during media limit enforcement." }, { status: 500 });
    }
    // ----------------------------

    // The rest of the upload logic
    const contentType = file.type;
    let mediaType: 'image' | 'video';
    let fileExtension: string;
    
    if (contentType.startsWith("image/")) {
        mediaType = 'image';
        fileExtension = '.webp';
    } else {
        return NextResponse.json({ success: false, message: "Unsupported file type. Only images are allowed." }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = new mongoose.Types.ObjectId();
    const filename = `${userId}_${uniqueId}${fileExtension}`;
    
    const targetDir = path.join(process.cwd(), "public", "LumoCreators", session.user.id, "images");
    await mkdir(targetDir, { recursive: true });
    const filepath = path.join(targetDir, filename);
    const publicUrl = `/LumoCreators/${session.user.id}/images/${filename}`;

    try {
        await sharp(buffer)
            .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);

        const newMedia = await Media.create({
            _id: uniqueId,
            uploadedBy: userId,
            mediaType,
            filename,
            path: publicUrl,
            tag: tag || undefined, // Save the tag, or undefined if not provided
        });

        return NextResponse.json({ success: true, data: newMedia }, { status: 201 });

    } catch (error) {
        console.error("Error processing or saving media:", error);
        return NextResponse.json({ success: false, message: "Server error while processing the file." }, { status: 500 });
    }
}
