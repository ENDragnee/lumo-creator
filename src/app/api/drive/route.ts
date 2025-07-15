// app/api/drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import Book, { IBook } from '@/models/Book'; // Adjust path
import Content, { IContent } from '@/models/Content'; // Adjust path
import mongoose, { Model, Document } from 'mongoose'; // Import necessary types

// --- Define interfaces for API responses ---

interface DriveItemBase {
    _id: string; // Always string in JSON
    title: string;
    data?: string; // Optional for content type
    thumbnail: string;
    createdAt: Date; // Keep as Date for potential client-side formatting
    updatedAt: Date; // Keep as Date
    parentId: string | null; // Always string or null in JSON
}

interface DriveBook extends DriveItemBase {
    type: 'book';
}

interface DriveContent extends DriveItemBase {
    type: 'content';
}

type DriveItem = DriveBook | DriveContent;

// Define a type for the item returned by POST/PUT
interface ApiResponseItem {
    _id: string;
    title: string;
    thumbnail: string;
    createdAt: Date;
    updatedAt: Date;
    parentId: string | null;
    createdBy: string;
    type: 'book' | 'content';
    isDraft?: boolean;
    institution?: string;
    subject?: string;
    tags?: string[]; // Optional, as it may not be set during creation
    // Add other relevant fields returned after creation/update
}

// Define expected shape of lean objects AFTER the query (including timestamps)
type ExpectedLeanBook = IBook & {
    _id: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    institution?: string;
    subject?: string;
};

type ExpectedLeanContent = IContent & {
    _id: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date; // Ensure updatedAt is expected
    institution?: string;
    subject?: string;
};


// --- GET Function ---
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get('parentId');
    let parentId: mongoose.Types.ObjectId | null = null;
    try {
        parentId = parentIdParam === 'null' || !parentIdParam ? null : new mongoose.Types.ObjectId(parentIdParam);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid parent ID format.' }, { status: 400 });
    }


    try {
        await connectDB();

        const queryConditions = {
            createdBy: userId,
            parentId: parentId,
            isTrash: false,
        };

        // **** Define separate select fields ****
        const selectFieldsBook = '_id title thumbnail createdAt updatedAt parentId createdBy isDraft';
        const selectFieldsContent = '_id title thumbnail createdAt updatedAt parentId createdBy isDraft data'; // <-- Added 'data' field

        // **** Use specific select fields for each query ****
        const booksPromise = Book.find(queryConditions)
            .select(selectFieldsBook) // Select fields for books
            .sort({ title: 1 })
            .lean()
            .exec();

        const contentsPromise = Content.find(queryConditions)
            .select(selectFieldsContent) // Select fields for content (including data)
            .sort({ title: 1 })
            .lean()
            .exec();

        const [books, contents] = await Promise.all([booksPromise, contentsPromise]);

        const items: DriveItem[] = [
            // Map books (no data field)
            ...(books as unknown as ExpectedLeanBook[]).map((book): DriveBook => ({
                _id: book._id.toString(),
                title: book.title,
                thumbnail: book.thumbnail,
                createdAt: book.createdAt,
                updatedAt: book.updatedAt,
                parentId: book.parentId ? book.parentId.toString() : null,
                type: 'book' as const,
            })),
            // Map contents (include data field)
            ...(contents as unknown as ExpectedLeanContent[]).map((content): DriveContent => ({
                _id: content._id.toString(),
                title: content.title,
                data: content.data, // Data is now selected and available
                thumbnail: content.thumbnail,
                createdAt: content.createdAt,
                updatedAt: content.updatedAt,
                parentId: content.parentId ? content.parentId.toString() : null,
                type: 'content' as const,
            }))
        ];

        // Fetch breadcrumbs (no changes needed here)
        let breadcrumbs: { _id: string; title: string }[] = [];
        if (parentId) {
            let currentParentId: mongoose.Types.ObjectId | null = parentId;
            while (currentParentId) {
                const parentBook = await Book.findById(currentParentId).select('_id title parentId').lean().exec();
                if (parentBook) {
                    const leanParent = parentBook as { _id: any, title: string, parentId: any }; // Simple assertion for lean breadcrumb
                    breadcrumbs.unshift({ _id: leanParent._id.toString(), title: leanParent.title });
                    currentParentId = leanParent.parentId instanceof mongoose.Types.ObjectId
                        ? leanParent.parentId
                        : (typeof leanParent.parentId === 'string' ? new mongoose.Types.ObjectId(leanParent.parentId) : null);
                } else {
                    currentParentId = null;
                }
            }
        }
        breadcrumbs.unshift({ _id: 'root', title: 'Home' });

        return NextResponse.json({ items, breadcrumbs });

    } catch (error: any) {
        console.error("API Drive GET Error:", error);
        if (error instanceof mongoose.Error.CastError) {
             return NextResponse.json({ error: 'Invalid ID format provided.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to fetch items', details: error.message }, { status: 500 });
    }
}


// --- POST Function ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    try {
        await connectDB();
        const body = await request.json();
        const { type, title, parentId: parentIdStr, thumbnail, data, institution, subject, tags } = body;

        if (!type || !title) {
            return NextResponse.json({ error: 'Missing required fields (type, title)' }, { status: 400 });
        }
        if (type !== 'book' && type !== 'content') {
            return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
        }

        let parentId: mongoose.Types.ObjectId | null = null;
        if (parentIdStr) {
            try {
                parentId = new mongoose.Types.ObjectId(parentIdStr);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid parent ID format.' }, { status: 400 });
            }
            const parentBook = await Book.findOne({ _id: parentId, createdBy: userId });
            if (!parentBook) {
                return NextResponse.json({ error: 'Parent folder not found or access denied' }, { status: 404 });
            }
        }

        let newItemDoc: Document<unknown, {}, IBook | IContent> & (IBook | IContent);

        const commonData = {
            title,
            parentId,
            createdBy: userId,
            thumbnail: thumbnail || (type === 'book' ? '/placeholder-folder.png' : '/placeholder-file.png'),
            isDraft: true,
            isTrash: false,
            institution,
            subject,
            tags: tags || [],
        };

        if (type === 'book') {
            newItemDoc = new Book(commonData);
        } else {
            newItemDoc = new Content({ ...commonData, data: data || '' });
        }

        await newItemDoc.save();

        // Fix 2: Assert the type AFTER save to tell TS that _id and timestamps are populated
        const savedDoc = newItemDoc as typeof newItemDoc & {
            _id: mongoose.Types.ObjectId;
            createdAt: Date;
            updatedAt: Date;
        };

        const responseItem: ApiResponseItem = {
            _id: savedDoc._id.toString(), // Access asserted _id
            title: savedDoc.title,
            thumbnail: savedDoc.thumbnail,
            createdAt: savedDoc.createdAt, // Access asserted createdAt
            updatedAt: savedDoc.updatedAt, // Access asserted updatedAt
            parentId: savedDoc.parentId ? savedDoc.parentId.toString() : null,
            createdBy: savedDoc.createdBy.toString(),
            type: type,
            isDraft: savedDoc.isDraft,
            institution: savedDoc.institution,
            subject: savedDoc.subject,
            tags: savedDoc.tags,
        };

        return NextResponse.json(responseItem, { status: 201 });

    } catch (error: any) {
        console.error("API Drive POST Error:", error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        if (error instanceof mongoose.Error.CastError) {
            return NextResponse.json({ error: 'Invalid ID format provided.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create item', details: error.message }, { status: 500 });
    }
}


// --- PUT Function ---
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    try {
        await connectDB();
        const body = await request.json();
        const { id, type, data } = body;

        if (!id || !type || !data || typeof data !== 'object') {
            return NextResponse.json({ error: 'Missing required fields (id, type, data)' }, { status: 400 });
        }
        if (type !== 'book' && type !== 'content') {
            return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
        }

        const ModelToUpdate: Model<IBook> | Model<IContent> = type === 'book' ? Book : Content;
        let itemId: mongoose.Types.ObjectId;
        try {
             itemId = new mongoose.Types.ObjectId(id);
        } catch (e) {
             return NextResponse.json({ error: 'Invalid item ID format.' }, { status: 400 });
        }


        const allowedUpdates: any = {};
        // Populate allowedUpdates (same as before)
        if (data.title !== undefined) allowedUpdates.title = data.title;
        if (data.thumbnail !== undefined) allowedUpdates.thumbnail = data.thumbnail;
        if (data.description !== undefined && type === 'book') allowedUpdates.description = data.description;
        if (data.data !== undefined && type === 'content') allowedUpdates.data = data.data;
        if (data.isDraft !== undefined) allowedUpdates.isDraft = data.isDraft;
        if (data.tags !== undefined) allowedUpdates.tags = data.tags;
        // Add other updatable fields here...

        if (Object.keys(allowedUpdates).length === 0) {
             return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
        }

        const updatedItemDocOrNull = await (ModelToUpdate as Model<any>).findOneAndUpdate(
            { _id: itemId, createdBy: userId },
            { $set: allowedUpdates },
            { new: true }
        ).lean();

        if (!updatedItemDocOrNull) {
            return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
        }

        // Fix 3: Use 'as unknown as ExpectedType' after null check
        // Define the expected shape based on IBook/IContent + timestamps + IDs
        type ExpectedPutResult = (IBook | IContent) & {
            _id: mongoose.Types.ObjectId;
            parentId: mongoose.Types.ObjectId | null;
            createdBy: mongoose.Types.ObjectId;
            createdAt: Date;
            updatedAt: Date;
        };
        const updatedItemDoc = updatedItemDocOrNull as unknown as ExpectedPutResult;


        const responseItem: ApiResponseItem = {
             _id: updatedItemDoc._id.toString(), // Assumed to exist
             title: updatedItemDoc.title,       // Assumed to exist
             thumbnail: updatedItemDoc.thumbnail,// Assumed to exist
             createdAt: updatedItemDoc.createdAt, // Assumed to exist
             updatedAt: updatedItemDoc.updatedAt, // Assumed to exist
             parentId: updatedItemDoc.parentId ? updatedItemDoc.parentId.toString() : null, // Assumed to exist
             createdBy: updatedItemDoc.createdBy.toString(), // Assumed to exist
             type: type,
             isDraft: updatedItemDoc.isDraft,     // Assumed to exist
        };

        return NextResponse.json(responseItem);

    } catch (error: any) {
        console.error("API Drive PUT Error:", error);
         if (error instanceof mongoose.Error.CastError) {
             return NextResponse.json({ error: 'Invalid ID format.' }, { status: 400 });
         }
         if (error instanceof mongoose.Error.ValidationError) {
              return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
         }
        return NextResponse.json({ error: 'Failed to update item', details: error.message }, { status: 500 });
    }
}


// --- DELETE Function ---
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Use createdBy consistently with your models
    const userId = new mongoose.Types.ObjectId(session.user.id);

    try {
        await connectDB();
        const body = await request.json();
        // Only expect id and type for trashing from the main view
        const { id, type } = body;

        if (!id || !type) {
            return NextResponse.json({ error: 'Missing required fields (id, type)' }, { status: 400 });
        }
        if (type !== 'book' && type !== 'content') {
            return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
        }

        const ModelToUse: Model<IBook> | Model<IContent> = type === 'book' ? Book : Content;
        let itemId: mongoose.Types.ObjectId;
        try {
             itemId = new mongoose.Types.ObjectId(id);
        } catch (e) {
             return NextResponse.json({ error: 'Invalid item ID format.' }, { status: 400 });
        }

        // --- Always Move to Trash ---
        const updateData = { $set: { isTrash: true, updatedAt: new Date() } };

        // Find the item first to ensure it exists and is owned by the user
        const itemToTrash = await (ModelToUse as Model<any>).findOne({
            _id: itemId,
            createdBy: userId,
            isTrash: false // Only trash items not already in trash
        });

        if (!itemToTrash) {
             return NextResponse.json({ error: 'Item not found, already in trash, or access denied' }, { status: 404 });
        }

        // Update the item itself
        await (ModelToUse as Model<any>).updateOne({ _id: itemId, createdBy: userId }, updateData);
        console.log(`${type} ${id} marked as trash.`);

        // --- Recursive Trashing for Books ---
        if (type === 'book') {
            console.log(`Recursively trashing contents of book ${id}`);
            // Note: This simple approach trashes immediate children.
            // For deeply nested structures, a more complex recursive function might be needed.
            const [bookUpdateResult, contentUpdateResult] = await Promise.all([
                Book.updateMany({ parentId: itemId, createdBy: userId }, updateData),
                Content.updateMany({ parentId: itemId, createdBy: userId }, updateData)
            ]);
            console.log(`Trashed ${bookUpdateResult.modifiedCount} sub-books and ${contentUpdateResult.modifiedCount} contents.`);
        }

        return NextResponse.json({ message: 'Item moved to trash successfully' }, { status: 200 });


    } catch (error: any) {
        console.error("API Drive DELETE Error:", error);
        if (error instanceof mongoose.Error.CastError) {
            return NextResponse.json({ error: 'Invalid item ID format.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to move item to trash', details: error.message }, { status: 500 });
    }
}
