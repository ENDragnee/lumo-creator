// @/app/api/books/route.ts
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import Book from "@/models/Book";
import Content from "@/models/Content";
import mongoose from "mongoose";

// --- GET all Books for the authenticated user ---
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

  const books = await Book.find(query)
    // **THE FIX**: Populate 'path' from the Media model, not 'url'.
    .populate<{ thumbnail: { path: string } }>('thumbnail', 'path')
    .sort({ updatedAt: -1 })
    .lean();
    
  const booksWithDetails = await Promise.all(
    books.map(async (book) => {
        const contentCount = await Content.countDocuments({ parentId: book._id, isTrash: false });
        return { 
            ...book, 
            contentCount,
            // **THE FIX**: Transform using '.path'. Books might not have a thumbnail, so default to null.
            thumbnail: book.thumbnail?.path || null
        };
    })
  );

  return NextResponse.json({ success: true, data: booksWithDetails });
});

// --- POST (Create) a new Book ---
// This handler does not populate, so no changes are needed, but it's included for completeness.
export const POST = withAuth(async (request, { userId }) => {
  const body = await request.json();
  const { title, description, parentId } = body;

  if (!title) {
    return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
  }

  const newBook = await Book.create({
    title,
    description,
    createdBy: new mongoose.Types.ObjectId(userId),
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  });

  const responseData = {
    ...newBook.toObject(),
    thumbnail: null // Manually add null thumbnail for frontend consistency
  }

  return NextResponse.json({ success: true, data: responseData }, { status: 201 });
});
