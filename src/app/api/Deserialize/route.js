import connectDB from '@/lib/db'
import Content from "@/models/Content"

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    let data

    if (id) {
      data = await Content.findById(id).select('data -_id').exec()
    } else {
      data = await Content.findOne()
        .sort({ createdAt: -1 })
        .select('data -_id')
        .exec()
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'No content found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}