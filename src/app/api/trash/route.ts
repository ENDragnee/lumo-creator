// app/api/trash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust path
import connectDB from '@/lib/db'; // Adjust path
import Book, { IBook } from '@/models/Book'; // Adjust path
import Content, { IContent } from '@/models/Content'; // Adjust path
import mongoose, { Model } from 'mongoose';

// --- GET Trashed Items ---
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id); // Use createdBy

    await connectDB();

    try {
        const findQuery = { createdBy: userId, isTrash: true };

        // Fetch trashed books and content
        const trashedBooksPromise = Book.find(findQuery).select('_id title thumbnail updatedAt createdAt parentId').sort({ updatedAt: -1 }).lean(); // Sort by last update (trash time)
        const trashedContentPromise = Content.find(findQuery).select('_id title thumbnail updatedAt createdAt parentId').sort({ updatedAt: -1 }).lean(); // Sort by last update

        const [trashedBooks, trashedContent] = await Promise.all([trashedBooksPromise, trashedContentPromise]);

        // Combine and map to a consistent format for the frontend
        const allTrashedItems = [
            ...trashedBooks.map(item => ({
                _id: item._id.toString(),
                type: 'book' as const,
                title: item.title,
                thumbnail: item.thumbnail || '/placeholder-folder.png', // Provide fallback
                updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date(0).toISOString(), // Provide fallback for undefined
                createdAt: item.createdAt.toISOString(),
                parentId: item.parentId ? item.parentId.toString() : null,
            })),
            ...trashedContent.map(item => ({
                _id: item._id.toString(),
                type: 'content' as const,
                title: item.title,
                thumbnail: item.thumbnail || '/placeholder-file.png', // Provide fallback
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date(0).toISOString(), // Provide fallback for undefined
                parentId: item.parentId ? item.parentId.toString() : null,
            }))
        ];

        // Sort combined list by updatedAt (which reflects trashing time) descending
        allTrashedItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json({ items: allTrashedItems }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching trash:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error fetching trash' }, { status: 500 });
    }
}

// --- PUT Restore Item ---
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id); // Use createdBy

    await connectDB();

    try {
        const { id, type } = await req.json();

        if (!id || !type || !['book', 'content'].includes(type)) {
            return NextResponse.json({ error: 'Missing or invalid parameters (id, type)' }, { status: 400 });
        }

        const ModelToUse: Model<IBook> | Model<IContent> = type === 'book' ? Book : Content;
        const objectId = new mongoose.Types.ObjectId(id);

        // Find the item to ensure it's in trash and owned by user
        const itemToRestore = await (ModelToUse as Model<any>).findOne({
             _id: objectId,
             createdBy: userId,
             isTrash: true
        });

        if (!itemToRestore) {
            return NextResponse.json({ error: `${type} not found in trash or access denied` }, { status: 404 });
        }

        // Restore the item: set isTrash to false and update timestamp
        const updateResult = await (ModelToUse as Model<any>).updateOne(
            { _id: objectId, createdBy: userId },
            { $set: { isTrash: false, updatedAt: new Date() } }
        );

        if (updateResult.modifiedCount === 0) {
             // Should not happen if itemToRestore was found, but good practice
            console.warn(`Restore operation did not modify item ${id}, possibly already restored.`);
            // Still return success as the state is now correct, or return a specific status? Let's return success.
        }

        // If restoring a book, we intentionally DO NOT recursively restore its contents.
        // The user must restore them individually if desired.

        console.log(`${type} ${id} restored from trash`);
        return NextResponse.json({ message: `${type} restored` }, { status: 200 });

    } catch (error: any) {
        console.error('Error restoring item from trash:', error);
        if (error instanceof mongoose.Error.CastError) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error restoring item' }, { status: 500 });
    }
}


// --- DELETE Permanently Delete Item ---
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id); // Use createdBy

    await connectDB();

    try {
        // Get ID and type from query parameters for DELETE requests
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        const type = url.searchParams.get('type');

        if (!id || !type || !['book', 'content'].includes(type)) {
            return NextResponse.json({ error: 'Missing or invalid query parameters (id, type)' }, { status: 400 });
        }

        const ModelToUse: Model<IBook> | Model<IContent> = type === 'book' ? Book : Content;
        const objectId = new mongoose.Types.ObjectId(id);

        // Find the item first to ensure it IS TRASHED and owned by the user
        const itemToDelete = await (ModelToUse as Model<any>).findOne({
            _id: objectId,
            createdBy: userId,
            isTrash: true // Crucial: Only delete from trash
        });

        if (!itemToDelete) {
            return NextResponse.json({ error: `${type} not found in trash or access denied` }, { status: 404 });
        }

        // --- Perform Deletion ---
        const deleteResult = await (ModelToUse as Model<any>).deleteOne({ _id: objectId, createdBy: userId });

        if (deleteResult.deletedCount === 0) {
             // Should not happen if itemToDelete was found
            return NextResponse.json({ error: `Failed to permanently delete ${type}` }, { status: 500 });
        }

        // If it's a book, permanently delete its contents as well (recursive)
        if (type === 'book') {
            console.log(`Permanently deleting contents of book ${id}`);
            // Simple recursive deletion (immediate children)
             const [deletedBooksResult, deletedContentResult] = await Promise.all([
                Book.deleteMany({ parentId: objectId, createdBy: userId }),
                Content.deleteMany({ parentId: objectId, createdBy: userId })
             ]);
             console.log(`Permanently deleted ${deletedBooksResult.deletedCount} sub-books and ${deletedContentResult.deletedCount} contents.`);
             // Add more robust recursion here if needed for deep structures
        }

        console.log(`${type} ${id} permanently deleted from trash`);
        return NextResponse.json({ message: `${type} permanently deleted` }, { status: 200 });

    } catch (error: any) {
        console.error('Error permanently deleting item from trash:', error);
        if (error instanceof mongoose.Error.CastError) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error deleting item' }, { status: 500 });
    }
}