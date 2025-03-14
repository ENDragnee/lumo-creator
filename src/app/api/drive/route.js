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

export async function PUT(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id, type, data } = await req.json();

    if (!id || !type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "content") {
      // Update content
      const content = await Content.findOneAndUpdate(
        { _id: id, createdBy: userId },
        { $set: data },
        { new: true }
      );
      
      if (!content) {
        return NextResponse.json({ error: "Content not found or unauthorized" }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, content });
    } else if (type === "book") {
      // Update book
      const book = await Book.findOneAndUpdate(
        { _id: id, createdBy: userId },
        { $set: data },
        { new: true }
      );
      
      if (!book) {
        return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, book });
    } else {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id, type } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "content") {
      // Delete content
      const content = await Content.findOneAndDelete({ _id: id, createdBy: userId });
      
      if (!content) {
        return NextResponse.json({ error: "Content not found or unauthorized" }, { status: 404 });
      }
      
      // If this content was in a book, remove it from the book's contents array
      if (content.isBook) {
        await Book.updateMany(
          { contents: id },
          { $pull: { contents: id } }
        );
      }
      
      return NextResponse.json({ success: true });
    } else if (type === "book") {
      // Delete book
      const book = await Book.findOneAndDelete({ _id: id, createdBy: userId });
      
      if (!book) {
        return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
      }
      
      // Optionally, you might want to delete all contents inside this book or mark them as not belonging to a book
      // For now, we'll just unlink them from the book
      await Content.updateMany(
        { _id: { $in: book.contents } },
        { $set: { isBook: false } }
      );
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}