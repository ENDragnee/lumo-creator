// @/app/api/books/[bookId]/route.ts
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import Book from "@/models/Book";
import Content from "@/models/Content";
import mongoose from "mongoose";

// --- GET a single Book by ID ---
export const GET = withAuth(async (request, { params, userId }) => {
  const { bookId } = params;

  const book = await Book.findOne({
    _id: bookId,
    createdBy: new mongoose.Types.ObjectId(userId),
  })
  // **THE FIX**: Correctly type the populated field to expect 'path'.
  .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
  .lean();

  if (!book) {
    return NextResponse.json({ success: false, message: "Book not found." }, { status: 404 });
  }

  // **THE FIX**: Access the correct '.path' property for the transformation.
  const transformedBook = {
    ...book,
    thumbnail: book.thumbnail?.path || null // Books may not have a thumbnail, so default to null.
  };

  return NextResponse.json({ success: true, data: transformedBook });
});

// --- PUT (Update) a Book ---
export const PUT = withAuth(async (request, { params, userId }) => {
  const { bookId } = params;
  const body = await request.json();

  const { createdBy, isTrash, ...updateData } = body;
  updateData.updatedAt = new Date();

  // If the frontend sends a thumbnail, ensure it's a valid ID before updating.
  if (updateData.thumbnail && !mongoose.Types.ObjectId.isValid(updateData.thumbnail)) {
      // If an invalid thumbnail is sent, remove it from the update to prevent errors.
      delete updateData.thumbnail;
  }

  const updatedBookDoc = await Book.findOneAndUpdate(
    { _id: bookId, createdBy: new mongoose.Types.ObjectId(userId) },
    { $set: updateData },
    { new: true }
  )
  // **THE FIX**: Correctly type the populated field to expect 'path'.
  .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
  .lean();

  if (!updatedBookDoc) {
    return NextResponse.json({ success: false, message: "Book not found or update failed." }, { status: 404 });
  }
  
  // **THE FIX**: Access the correct '.path' property for the transformation.
  const transformedBook = {
      ...updatedBookDoc,
      thumbnail: updatedBookDoc.thumbnail?.path || null
  }

  return NextResponse.json({ success: true, data: transformedBook });
});


// --- DELETE (Soft Delete) a Book and its contents ---
// This handler was already correct and needs no changes.
export const DELETE = withAuth(async (request, { params, userId }) => {
  const { bookId } = params;
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
        // Soft-delete the book itself
        const bookUpdateResult = await Book.updateOne(
            { _id: bookId, createdBy: new mongoose.Types.ObjectId(userId) },
            { $set: { isTrash: true, updatedAt: new Date() } },
            { session }
        );

        if (bookUpdateResult.matchedCount === 0) {
            // Throw an error to abort the transaction
            throw new Error("Book not found or you lack permission.");
        }

        // Soft-delete all content items that have this book as a parent
        await Content.updateMany(
            { parentId: bookId, createdBy: new mongoose.Types.ObjectId(userId) },
            { $set: { isTrash: true, lastModifiedAt: new Date() } },
            { session }
        );
    });

    return NextResponse.json({ success: true, message: "Book and its contents moved to trash." });
  } catch(error: any) {
    console.error("Transaction failed during book deletion:", error);
    // Send a more specific error message if available
    const message = error.message === "Book not found or you lack permission." 
        ? error.message 
        : "Failed to delete book due to a server error.";
    const status = error.message.includes("permission") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  } finally {
    session.endSession();
  }
});
