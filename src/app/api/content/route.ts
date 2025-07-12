// @/app/api/content/route.ts
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import Content from "@/models/Content";
import mongoose from "mongoose";
import { isDraft } from "@reduxjs/toolkit";

// --- GET all Content for the authenticated user ---
export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  const query: any = {
    createdBy: new mongoose.Types.ObjectId(userId),
    isTrash: false,
  };

  if (parentId) {
    query.parentId = parentId === "null" ? null : new mongoose.Types.ObjectId(parentId);
  }

  // Use .lean() for better performance as we are only reading data.
  const contents = await Content.find(query)
    // **THE FIX**: Populate the 'path' field from the Media model, not 'url'.
    .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
    .sort({ lastModifiedAt: -1 })
    .lean();

  // **THE FIX**: Transform the data using the correct '.path' property.
  const transformedContents = contents.map(content => {
    return {
      ...content,
      // If thumbnail was populated, it's an object. Extract the path.
      thumbnail: content.thumbnail?.path || '/default-thumbnail.png',
    };
  });

  return NextResponse.json({ success: true, data: transformedContents });
});

// --- POST (Create) a new Content item ---
export const POST = withAuth(async (request, { userId }) => {
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
    createdBy: new mongoose.Types.ObjectId(userId),
    thumbnail: new mongoose.Types.ObjectId(thumbnail),
    isDraft: true,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  });

  // Populate the new content item before sending it back to get the thumbnail URL
  const populatedNewContent = await Content.findById(newContent._id)
    // **THE FIX**: Populate 'path', not 'url'.
    .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
    .lean();
  
  if (!populatedNewContent) {
     return NextResponse.json({ success: false, message: "Failed to retrieve newly created content." }, { status: 500 });
  }

  // **THE FIX**: Transform using '.path'.
  const transformedNewContent = {
    ...populatedNewContent,
    thumbnail: populatedNewContent.thumbnail?.path || '/default-thumbnail.png'
  }

  return NextResponse.json({ success: true, data: transformedNewContent }, { status: 201 });
});
