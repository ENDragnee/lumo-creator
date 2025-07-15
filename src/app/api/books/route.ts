// @/app/api/books/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Standard path for NextAuth options
import Book from "@/models/Book";
import Content from "@/models/Content";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

// --- GET all Books for the authenticated user ---
export async function GET(request: Request) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
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

  const books = await Book.find(query)
    .populate<{ thumbnail: { path: string } }>("thumbnail", "path")
    .sort({ updatedAt: -1 })
    .lean();

  const booksWithDetails = await Promise.all(
    books.map(async (book) => {
      const contentCount = await Content.countDocuments({
        parentId: book._id,
        isTrash: false,
      });
      return {
        ...book,
        contentCount,
        thumbnail: book.thumbnail?.path || null,
      };
    })
  );

  return NextResponse.json({ success: true, data: booksWithDetails });
}

// --- POST (Create) a new Book ---
export async function POST(request: Request) {
  // Handle authentication directly
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // The rest of the logic remains the same
  const body = await request.json();
  const { title, description, parentId } = body;

  if (!title) {
    return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
  }

  const newBook = await Book.create({
    title,
    description,
    createdBy: new mongoose.Types.ObjectId(userId), // Use authenticated userId
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  });

  const responseData = {
    ...newBook.toObject(),
    thumbnail: null, // Manually add null thumbnail for frontend consistency
  };

  return NextResponse.json({ success: true, data: responseData }, { status: 201 });
}
