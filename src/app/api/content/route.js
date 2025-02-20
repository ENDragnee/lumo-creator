import connectDB from "@/lib/db";
import Content from "@/models/Content";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the request body for the new content
    const { title, thumbnail, data, tags, institution, subject } = await req.json();

    if (!title || !thumbnail || !data) {
      return new Response(
        JSON.stringify({ error: "Title, thumbnail, and data are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a new Content document with defaults for fields like views, passRate, and userEngagement.
    const newContent = new Content({
      title,
      thumbnail,
      data,
      tags: tags || [],
      institution,
      subject,
      createdBy: session.user.id,
    });

    await newContent.save();

    return new Response(JSON.stringify(newContent), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function GET() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export function PUT() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export function DELETE() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
