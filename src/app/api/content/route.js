// app/api/drive/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Content from "@/models/Content";
import Book from "@/models/Book";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, ...data } = await req.json();

  if (type === "content") {
    const { title, thumbnail, data: contentData, tags, institution, subject } = data;
    if (!title || !thumbnail || !contentData) {
      return NextResponse.json(
        { error: "Title, thumbnail, and data are required for content" },
        { status: 400 }
      );
    }
    try {
      const newContent = new Content({
        title,
        thumbnail,
        data: contentData,
        tags: tags || [],
        institution,
        subject,
        createdBy: session.user.id,
      });
      await newContent.save();
      return NextResponse.json(newContent, { status: 201 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } else if (type === "book") {
    const { title, description, thumbnail, tags, genre } = data;
    if (!title || !thumbnail) {
      return NextResponse.json(
        { error: "Title and thumbnail are required for a book" },
        { status: 400 }
      );
    }
    try {
      const newBook = new Book({
        title,
        description,
        thumbnail,
        contents: [], // start with an empty list
        tags: tags || [],
        genre,
        createdBy: session.user.id,
      });
      await newBook.save();
      return NextResponse.json(newBook, { status: 201 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}


export async function PUT(req) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { contentId, data } = await req.json()

    if (!contentId || !data) {
      return new Response(
        JSON.stringify({ error: "contentId and data are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const content = await Content.findById(contentId)
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Ensure only the creator can update the content
    if (content.createdBy.toString() !== session.user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Update the data field
    content.data = data
    content.lastModifiedAt = new Date()
    await content.save()

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export function GET() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  })
}

export function DELETE() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  })
}