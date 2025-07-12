// @/app/api/content/[contentId]/route.ts
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import Content from "@/models/Content";
import mongoose from "mongoose";

// --- GET a single Content item by ID ---
export const GET = withAuth(async (request, { params, userId }) => {
  const { contentId } = await params;

  const content = await Content.findOne({
    _id: contentId,
    createdBy: new mongoose.Types.ObjectId(userId),
  })
  // **THE FIX**: Populate 'path', not 'url'.
  .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
  .lean();

  if (!content) {
    return NextResponse.json({ success: false, message: "Content not found or you do not have permission." }, { status: 404 });
  }

  // **THE FIX**: Transform using '.path'.
  const transformedContent = {
    ...content,
    thumbnail: content.thumbnail?.path || '/default-thumbnail.png'
  };

  return NextResponse.json({ success: true, data: transformedContent });
});

// --- PUT (Update) a Content item ---
export const PUT = withAuth(async (request, { params, userId }) => {
  const { contentId } = params;
  const body = await request.json();

  if (body.thumbnail && !mongoose.Types.ObjectId.isValid(body.thumbnail)) {
      delete body.thumbnail;
  }

  const { createdBy, isTrash, ...updateData } = body;
  
  const updatePayload = {
    $set: { ...updateData, lastModifiedAt: new Date() },
    $inc: { version: 1 }
  };

  const updatedContentDoc = await Content.findOneAndUpdate(
    { _id: contentId, createdBy: new mongoose.Types.ObjectId(userId) },
    updatePayload,
    { new: true }
  )
  // **THE FIX**: Populate 'path', not 'url'.
  .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
  .lean();

  if (!updatedContentDoc) {
    return NextResponse.json({ success: false, message: "Content not found or update failed." }, { status: 404 });
  }
  
  // **THE FIX**: Transform the response data using '.path'.
  const transformedUpdatedContent = {
      ...updatedContentDoc,
      thumbnail: updatedContentDoc.thumbnail?.path || '/default-thumbnail.png'
  };

  return NextResponse.json({ success: true, data: transformedUpdatedContent });
});

// --- DELETE (Soft Delete) a Content item ---
export const DELETE = withAuth(async (request, { params, userId }) => {
  const { contentId } = await params;

  const result = await Content.updateOne(
    { _id: contentId, createdBy: new mongoose.Types.ObjectId(userId) },
    { $set: { isTrash: true, lastModifiedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ success: false, message: "Content not found or you lack permission." }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Content moved to trash." });
});
