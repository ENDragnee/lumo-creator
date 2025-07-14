// @/app/api/content/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Standard path for NextAuth options
import Content from "@/models/Content";
import mongoose from "mongoose";
// The 'isDraft' import from Redux Toolkit was unused and has been removed.

// --- GET all Content for the authenticated user ---
export async function GET(request: Request) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // The rest of the logic remains the same
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  const query: any = {
    createdBy: new mongoose.Types.ObjectId(userId), // Use authenticated userId
    isTrash: false,
  };

  if (parentId) {
    query.parentId = parentId === "null" ? null : new mongoose.Types.ObjectId(parentId);
  }

  const contents = await Content.find(query)
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .sort({ lastModifiedAt: -1 })
    .lean();

  const transformedContents = contents.map((content) => {
    return {
      ...content,
      thumbnail: content.thumbnail?.path || "/default-thumbnail.png",
    };
  });

  return NextResponse.json({ success: true, data: transformedContents });
}

// --- POST (Create) a new Content item ---
export async function POST(request: Request) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // The rest of the logic remains the same
  const body = await request.json();
  const { title, thumbnail, parentId, contentType } = body;

  if (!title || !thumbnail || !contentType) {
    return NextResponse.json(
      { success: false, message: "Title, thumbnail, and contentType are required." },
      { status: 400 }
    );
  }

  const newContent = await Content.create({
    ...body,
    data: `{\"ROOT\":{\"type\":{\"resolvedName\":\"renderCanvas\"},\"isCanvas\":true,\"props\":{\"gap\":8,\"padding\":16},\"displayName\":\"Canvas\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}`,
    createdBy: new mongoose.Types.ObjectId(userId), // Use authenticated userId
    thumbnail: new mongoose.Types.ObjectId(thumbnail),
    isDraft: true,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  });

  const populatedNewContent = await Content.findById(newContent._id)
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean();

  if (!populatedNewContent) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve newly created content." },
      { status: 500 }
    );
  }

  const transformedNewContent = {
    ...populatedNewContent,
    thumbnail: populatedNewContent.thumbnail?.path || "/default-thumbnail.png",
  };

  return NextResponse.json({ success: true, data: transformedNewContent }, { status: 201 });
}
