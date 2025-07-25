import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Collection from "@/models/Collection";
import Content from "@/models/Content";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ collectionId: string }>;
}

// GET all content within a collection for the graph view
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const { collectionId } = await params;

  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    return NextResponse.json({ success: false, message: "Invalid Collection ID" }, { status: 400 });
  }

  // First, verify the user owns the collection
  const collection = await Collection.findOne({ _id: collectionId, createdBy: userId });
  if (!collection) {
    return NextResponse.json({ success: false, message: "Collection not found or permission denied." }, { status: 404 });
  }
  
  // Fetch all content items that belong to this collection
  const contentItems = await Content.find({
    parentId: collectionId,
    createdBy: userId,
    isTrash: false,
  })
  .select('_id title prerequisites thumbnail') // Select only needed fields
  .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
  .lean();

  const formattedContent = contentItems.map(item => ({
    ...item,
    thumbnail: item.thumbnail?.path || null,
  }));

  return NextResponse.json({ success: true, data: formattedContent });
}
