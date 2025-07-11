// @/lib/api-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// **THE FIX**: Import all your Mongoose models here to ensure they are registered.
// Mongoose's model registration is global. Importing a model file anywhere
// in the execution path makes it available to all other parts of the application
// that share the same Mongoose instance. By putting them in this central handler,
// you guarantee they are registered before any API logic runs.
import "@/models/User"; // Assuming you have a User model used by auth
import "@/models/Media";
import "@/models/Book";
import "@/models/Content";

// Define the type for our authenticated handler context
interface AuthContext {
  session: Session;
  userId: string;
}

// Define the type for the handler function we will wrap
type AuthenticatedApiHandler = (
  req: NextRequest,
  context: { params?: any } & AuthContext
) => Promise<NextResponse>;

/**
 * A higher-order function to wrap API route handlers.
 * It handles database connection, session authentication, and global error handling.
 */
export function withAuth(handler: AuthenticatedApiHandler) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      // 1. Connect to the database
      await connectDB();

      // 2. Get the user session
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      // 3. Validate session
      if (!session || !userId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }

      // 4. Inject session and userId into context and call the original handler
      const authContext: AuthContext = { session, userId };
      return await handler(req, { ...context, ...authContext });

    } catch (error) {
      console.error("API Route Error:", error);

      // Handle MissingSchemaError specifically
      if (error instanceof mongoose.Error.MissingSchemaError) {
          return NextResponse.json(
              { success: false, message: "A model schema is missing. Check that all models are imported in the API handler." },
              { status: 500 }
          );
      }

      // Handle specific Mongoose CastError (e.g., invalid ObjectId)
      if (error instanceof mongoose.Error.CastError) {
        return NextResponse.json(
          { success: false, message: `Invalid ID format for: ${error.path}` },
          { status: 400 }
        );
      }

      // Generic server error
      return NextResponse.json(
        { success: false, message: "An internal server error occurred." },
        { status: 500 }
      );
    }
  };
}
