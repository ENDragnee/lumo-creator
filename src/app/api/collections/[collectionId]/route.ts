// @/app/api/collections/[collectionId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Collection from "@/models/Collection";
import Content from "@/models/Content";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

type CollectionProp = {
  params: Promise<{
    collectionId: string;
  }>;
};

// --- GET a single Collection by ID with its ordered children ---
export async function GET(request: NextRequest, { params }: CollectionProp) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const { collectionId } = await params;

  // Find the collection and populate its children
  const collection = await Collection.findOne({
    _id: collectionId,
    createdBy: userId,
  })
    // Populate the ordered children arrays. This is the key to getting the sequence!
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .populate({
      path: 'childContent',
      model: Content, // Explicitly specify the model for population
      populate: { path: 'thumbnail', select: 'path' } // Also populate thumbnail of content
    })
    .populate({
      path: 'childCollections',
      model: Collection, // Populate nested collections
      populate: { path: 'thumbnail', select: 'path' }
    })
    .lean();

  if (!collection) {
    return NextResponse.json({ success: false, message: "Collection not found." }, { status: 404 });
  }
  
  // The populated data is already in the correct format and order
  return NextResponse.json({ success: true, data: collection });
}

// --- PUT (Update) a Collection ---
export async function PUT(request: NextRequest, { params }: CollectionProp) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const { collectionId } = await params;
  const body = await request.json();

  // Exclude fields that shouldn't be updated directly
  const { createdBy, isTrash, parentId, childCollections, childContent, ...updateData } = body;
  updateData.updatedAt = new Date();

  if (updateData.thumbnail && !mongoose.Types.ObjectId.isValid(updateData.thumbnail)) {
    delete updateData.thumbnail;
  }
  
  // Note: Handling parentId changes is a complex operation (moving a folder)
  // and would require a separate, more detailed transaction logic.
  // This PUT handler focuses on updating metadata like title, description, etc.

  const updatedCollectionDoc = await Collection.findOneAndUpdate(
    { _id: collectionId, createdBy: userId },
    { $set: updateData },
    { new: true }
  )
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean();

  if (!updatedCollectionDoc) {
    return NextResponse.json({ success: false, message: "Collection not found or update failed." }, { status: 404 });
  }

  const transformedCollection = {
    ...updatedCollectionDoc,
    thumbnail: updatedCollectionDoc.thumbnail?.path || null,
  };

  return NextResponse.json({ success: true, data: transformedCollection });
}

// --- DELETE (Soft Delete) a Collection and its contents ---
export async function DELETE(request: NextRequest, { params }: CollectionProp) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const { collectionId } = await params;

  const dbSession = await mongoose.startSession();
  
  try {
    await dbSession.withTransaction(async () => {
      // 1. Find the collection to get its parentId before deleting
      const collectionToDelete = await Collection.findOne(
        { _id: collectionId, createdBy: userId },
        { parentId: 1 } // Only fetch the parentId
      ).session(dbSession);

      if (!collectionToDelete) {
        throw new Error("Collection not found or you lack permission.");
      }

      // 2. If it has a parent, remove this collection from the parent's childCollections array
      if (collectionToDelete.parentId) {
        await Collection.updateOne(
          { _id: collectionToDelete.parentId, createdBy: userId },
          { $pull: { childCollections: collectionId } },
          { session: dbSession }
        );
      }

      // 3. Mark the collection itself as trashed
      await Collection.updateOne(
        { _id: collectionId, createdBy: userId },
        { $set: { isTrash: true, updatedAt: new Date() } },
        { session: dbSession }
      );
      
      // 4. Recursively mark all child content as trashed
      await Content.updateMany(
        { parentId: collectionId, createdBy: userId },
        { $set: { isTrash: true, lastModifiedAt: new Date() } },
        { session: dbSession }
      );
      
      // 5. Recursively mark all child collections as trashed
      await Collection.updateMany(
        { parentId: collectionId, createdBy: userId },
        { $set: { isTrash: true, updatedAt: new Date() } },
        { session: dbSession }
      );
    });

    return NextResponse.json({ success: true, message: "Collection and its contents moved to trash." });
  } catch (error: any) {
    console.error("Transaction failed during collection deletion:", error);
    const message =
      error.message === "Collection not found or you lack permission."
        ? error.message
        : "Failed to delete collection due to a server error.";
    const status = error.message.includes("permission") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  } finally {
    dbSession.endSession();
  }
}
