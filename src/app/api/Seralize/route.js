import connectDB from '@/lib/db';
import mongoose from 'mongoose';

// Define the schema
const SerializedDataSchema = new mongoose.Schema({
  data: String,
  createdAt: { type: Date, default: Date.now }
});

// Check if model already exists to prevent OverwriteModelError
let SerializedData;
try {
  SerializedData = mongoose.model('Content');
} catch (error) {
  SerializedData = mongoose.model('Content', SerializedDataSchema);
}

export async function POST(req) {
  try {
    await connectDB();

    // Parse the request body
    const data = await req.json();

    if (!data) {
      return new Response(JSON.stringify({ error: 'Data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create and save new document
    const newData = new SerializedData({ data });
    await newData.save();

    return new Response(JSON.stringify(newData), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export function GET() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function PUT() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function DELETE() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}