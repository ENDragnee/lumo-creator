import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Content from "@/models/Content";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

type ContentRouteParams = {
  params: Promise<{ 
    contentId: string;
  }>;
};

// --- GET a single Content item by ID ---
export async function GET(
  request: NextRequest,
  { params }: ContentRouteParams
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user.id;
  const { contentId } = await params;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return NextResponse.json({ success: false, message: "Invalid Content ID" }, { status: 400 });
  }

  const content = await Content.findOne({
    _id: contentId,
    createdBy: new mongoose.Types.ObjectId(userId),
  })
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean(); // .lean() is important for performance and to get a plain JS object

  if (!content) {
    return NextResponse.json(
      { success: false, message: "Content not found or you do not have permission." },
      { status: 404 }
    );
  }

  // UPDATED: Return the data field as a JSON object directly.
  // The model's default ensures 'data' is an object even if it's null/undefined in the DB.
  const transformedContent = {
    ...content,
    thumbnail: content.thumbnail?.path || "/default-thumbnail.png",
    data: content.data, // No stringification needed.
  };

  return NextResponse.json({ success: true, data: transformedContent });
}

// --- PUT (Update) a Content item ---
export async function PUT(
  request: NextRequest,
  { params }: ContentRouteParams
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user.id;
  const { contentId } = await params;
  const body = await request.json();

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return NextResponse.json({ success: false, message: "Invalid Content ID" }, { status: 400 });
  }

  // Prevent users from updating protected fields
  const { createdBy, isTrash, _id, version, ...updateData } = body;
  
  // The frontend now sends `data` as a JSON object, which `updateData` will contain.
  // The `Mixed` type in the Mongoose schema will store the object correctly.
  const updatePayload = {
    $set: { ...updateData, lastModifiedAt: new Date() },
    $inc: { version: 1 },
  };

  const updatedContentDoc = await Content.findOneAndUpdate(
    { _id: contentId, createdBy: new mongoose.Types.ObjectId(userId) },
    updatePayload,
    { new: true }
  )
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean();

  if (!updatedContentDoc) {
    return NextResponse.json(
      { success: false, message: "Content not found or update failed." },
      { status: 404 }
    );
  }
  
  // UPDATED: Return the data field as a JSON object directly.
  const transformedUpdatedContent = {
    ...updatedContentDoc,
    thumbnail: updatedContentDoc.thumbnail?.path || "/default-thumbnail.png",
    data: updatedContentDoc.data,
  };

  return NextResponse.json({ success: true, data: transformedUpdatedContent });
}

// --- DELETE (Soft Delete) a Content item ---
export async function DELETE(
  request: NextRequest,
  { params }: ContentRouteParams
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user.id;
  const { contentId } = await params;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return NextResponse.json({ success: false, message: "Invalid Content ID" }, { status: 400 });
  }

  const result = await Content.updateOne(
    { _id: contentId, createdBy: new mongoose.Types.ObjectId(userId) },
    { $set: { isTrash: true, lastModifiedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { success: false, message: "Content not found or you lack permission." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "Content moved to trash." });
}
