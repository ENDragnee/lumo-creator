// @/app/api/books/[bookId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Standard path for NextAuth options
import Book from "@/models/Book";
import Content from "@/models/Content";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

type BookProp = {
  params: Promise<{
    bookId: string
  }>
}
// --- GET a single Book by ID ---
export async function GET(
  request: NextRequest,
  { params }: BookProp 
) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB()
  const userId = session.user.id;
  const { bookId } = await params;

  // The rest of the logic remains the same
  const book = await Book.findOne({
    _id: bookId,
    createdBy: new mongoose.Types.ObjectId(userId), // Use the authenticated userId
  })
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean();

  if (!book) {
    return NextResponse.json({ success: false, message: "Book not found." }, { status: 404 });
  }

  const transformedBook = {
    ...book,
    thumbnail: book.thumbnail?.path || null,
  };

  return NextResponse.json({ success: true, data: transformedBook });
}

// --- PUT (Update) a Book ---
export async function PUT(
  request: NextRequest,
  { params }: BookProp 
) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB()
  const userId = session.user.id;
  const { bookId } = await params;
  const body = await request.json();

  const { createdBy, isTrash, ...updateData } = body;
  updateData.updatedAt = new Date();

  if (updateData.thumbnail && !mongoose.Types.ObjectId.isValid(updateData.thumbnail)) {
    delete updateData.thumbnail;
  }

  const updatedBookDoc = await Book.findOneAndUpdate(
    { _id: bookId, createdBy: new mongoose.Types.ObjectId(userId) }, // Use the authenticated userId
    { $set: updateData },
    { new: true }
  )
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .lean();

  if (!updatedBookDoc) {
    return NextResponse.json({ success: false, message: "Book not found or update failed." }, { status: 404 });
  }

  const transformedBook = {
    ...updatedBookDoc,
    thumbnail: updatedBookDoc.thumbnail?.path || null,
  };

  return NextResponse.json({ success: true, data: transformedBook });
}

// --- DELETE (Soft Delete) a Book and its contents ---
export async function DELETE(
  request: NextRequest,
  { params }: BookProp 
) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB()
  const userId = session.user.id;
  const { bookId } = await params;

  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {
      const bookUpdateResult = await Book.updateOne(
        { _id: bookId, createdBy: new mongoose.Types.ObjectId(userId) }, // Use the authenticated userId
        { $set: { isTrash: true, updatedAt: new Date() } },
        { session: dbSession }
      );

      if (bookUpdateResult.matchedCount === 0) {
        throw new Error("Book not found or you lack permission.");
      }

      await Content.updateMany(
        { parentId: bookId, createdBy: new mongoose.Types.ObjectId(userId) }, // Use the authenticated userId
        { $set: { isTrash: true, lastModifiedAt: new Date() } },
        { session: dbSession }
      );
    });

    return NextResponse.json({ success: true, message: "Book and its contents moved to trash." });
  } catch (error: any) {
    console.error("Transaction failed during book deletion:", error);
    const message =
      error.message === "Book not found or you lack permission."
        ? error.message
        : "Failed to delete book due to a server error.";
    const status = error.message.includes("permission") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  } finally {
    dbSession.endSession();
  }
}
