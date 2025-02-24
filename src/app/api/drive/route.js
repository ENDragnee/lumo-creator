// app/api/drive/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // adjust path as needed
import connectDB from "@/lib/db";
import Content from "@/models/Content";
import Book from "@/models/Book";

// In /api/drive/route.ts
export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);

    // NEW: If a contentId is provided, fetch that content document
    const contentId = searchParams.get("contentId");
    if (contentId) {
      const content = await Content.findOne({ _id: contentId, createdBy: userId });
      if (!content) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
      return NextResponse.json({ content });
    }

    // Existing logic for fetching a book if provided
    const bookId = searchParams.get("bookId");
    if (bookId) {
      const book = await Book.findOne({ _id: bookId, createdBy: userId }).populate("contents");
      if (!book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }
      return NextResponse.json({ book });
    } else {
      const books = await Book.find({ createdBy: userId });
      const contents = await Content.find({ createdBy: userId, isBook: false });
      return NextResponse.json({ books, contents });
    }
  } catch (error) {
    console.error("Error fetching drive items:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


