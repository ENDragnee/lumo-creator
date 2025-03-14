import connectDB from "@/lib/db"
import Content from "@/models/Content"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { title, thumbnail, data, tags, institution, subject } = await req.json()

    if (!title || !thumbnail || !data) {
      return new Response(
        JSON.stringify({ error: "Title, thumbnail, and data are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const newContent = new Content({
      title,
      thumbnail,
      data,
      tags: tags || [],
      institution,
      subject,
      createdBy: session.user.id,
    })

    await newContent.save()

    return new Response(JSON.stringify(newContent), {
      status: 201,
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