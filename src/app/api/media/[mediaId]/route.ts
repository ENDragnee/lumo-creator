// @/app/api/media/[mediaId]/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Media from "@/models/Media";
import { withAuth } from "@/lib/api-handler";


// --- GET a Single Media Item ---
export const GET = withAuth(async (request, { params, userId }) => {
  const { mediaId } = params;

  // Find the media item ensuring it belongs to the authenticated user
  const media = await Media.findOne({ _id: mediaId, uploadedBy: userId });

  if (!media) {
    return NextResponse.json(
      { success: false, message: "Media not found or you do not have permission to view it." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: media });
});

// --- PUT (Update) a Media Item ---
// Note: The current model has few updatable fields. This is a placeholder.
// You could extend the Media model with 'title', 'altText', 'description' fields to make this more useful.
export const PUT = withAuth(async (request, { params, userId }) => {
    const { mediaId } = params;
    const body = await request.json();

    // Fields that are allowed to be updated. Avoid updating URL/filename here unless you also rename the file.
    const { filename } = body; 

    if (!filename) {
        return NextResponse.json({ success: false, message: "No updateable fields provided." }, { status: 400 });
    }

    // Find the original media to get the old filename for renaming
    const originalMedia = await Media.findOne({ _id: mediaId, uploadedBy: userId });
    if (!originalMedia) {
        return NextResponse.json({ success: false, message: "Media not found." }, { status: 404 });
    }

    // **Caution**: Renaming a file on the filesystem and DB must be an atomic transaction, which is hard.
    // For simplicity, we'll just update the DB. A more robust solution might be needed for production.
    // Let's assume the client knows what it's doing.
    const updatedMedia = await Media.findOneAndUpdate(
        { _id: mediaId, uploadedBy: userId },
        { $set: { filename: filename } }, // Update only the 'filename' field
        { new: true } // Return the updated document
    );
    
    if (!updatedMedia) {
        // This case is unlikely if originalMedia was found, but good practice.
        return NextResponse.json({ success: false, message: "Update failed or media not found." }, { status: 404 });
    }
    
    // Note: This does NOT rename the physical file. To do that, you'd add:
    // const oldPath = path.join(process.cwd(), "public", originalMedia.url);
    // const newPath = path.join(path.dirname(oldPath), filename);
    // await fs.rename(oldPath, newPath);
    // And also update the `url` field in the database.

    return NextResponse.json({ success: true, data: updatedMedia });
});


// --- DELETE a Media Item ---
export const DELETE = withAuth(async (request, { params, userId }) => {
  const { mediaId } = params;

  // 1. Find the DB record to get file details before deleting.
  // Crucially, we check that the media item belongs to the user trying to delete it.
  const mediaToDelete = await Media.findOne({ _id: mediaId, uploadedBy: userId });

  if (!mediaToDelete) {
    return NextResponse.json(
      { success: false, message: "Media not found or you do not have permission to delete it." },
      { status: 404 }
    );
  }

  try {
    // 2. Delete the physical file from the filesystem.
    const filePath = path.join(process.cwd(), "public", mediaToDelete.path);
    await fs.unlink(filePath);
    console.log(`Successfully deleted file: ${filePath}`);

  } catch (error: any) {
    // If the file doesn't exist, we can still proceed to delete the DB record.
    if (error.code !== 'ENOENT') {
      console.error("Error deleting file from filesystem:", error);
      // Decide if you want to stop the process if file deletion fails.
      // For now, we log the error but still attempt to delete the DB record.
    }
  }

  // 3. Delete the record from the database.
  await Media.findByIdAndDelete(mediaId);

  return NextResponse.json({ success: true, message: "Media deleted successfully." });
});
