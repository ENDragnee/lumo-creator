// components/TrashPage.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Undo, Trash2, Folder, FileText, AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns'; // For user-friendly dates

// Interface matching the data structure returned by GET /api/trash
interface TrashItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
    updatedAt: string; // ISO Date string (reflects trash time)
    createdAt: string; // ISO Date string
    parentId: string | null;
}

export function TrashPage() {
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchTrashedItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/trash'); // Use the correct endpoint
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setItems(data.items || []);
        } catch (err: any) {
            console.error("Failed to fetch trash items:", err);
            setError(err.message || 'Failed to load items.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrashedItems();
    }, [fetchTrashedItems]);

    const handleRestore = async (item: TrashItem) => {
        if (processingId) return;
        setProcessingId(item._id);
        setError(null); // Clear previous errors
        try {
            const response = await fetch(`/api/trash`, { // Use PUT method
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item._id, type: item.type }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            // Optimistic update: Remove from trash list
            setItems(prev => prev.filter(i => i._id !== item._id));
            // Add success notification if desired
        } catch (err: any) {
            console.error("Failed to restore item:", err);
            setError(`Failed to restore "${item.title}": ${err.message}`);
            // Add error notification if desired
        } finally {
            setProcessingId(null);
        }
    };

    const handlePermanentDelete = async (item: TrashItem) => {
         if (processingId) return;
         setProcessingId(item._id);
         setError(null); // Clear previous errors
        try {
            // Use DELETE method with query parameters
            const response = await fetch(`/api/trash?id=${item._id}&type=${item.type}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            // Optimistic update: Remove from trash list
            setItems(prev => prev.filter(i => i._id !== item._id));
             // Add success notification if desired
        } catch (err: any) {
            console.error("Failed to permanently delete item:", err);
            setError(`Failed to delete "${item.title}": ${err.message}`);
             // Add error notification if desired
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-200">
             <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Trash2 className="h-5 w-5"/>
                    Trash
                </h1>
                 {/* Optional: Add "Empty Trash" button later */}
            </header>

             {error && (
                <div className="p-3 mx-4 mt-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center gap-2">
                     <AlertTriangle className="h-4 w-4 flex-shrink-0"/>
                     <span><span className="font-semibold">Error:</span> {error}</span>
                 </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent px-4 sm:px-6 pb-6 pt-4">

                {loading && (
                    <ul className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <li key={i} className="flex items-center p-2 space-x-3 h-[68px]">
                                <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 ml-auto mr-2" />
                                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && items.length === 0 && !error && ( // Show only if not loading, no items, and no error
                     <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <Inbox className="h-16 w-16 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                        <p className="font-medium">Trash is empty</p>
                        <p className="text-sm mt-1">Items moved to the trash will appear here.</p>
                    </div>
                )}

                 {!loading && items.length > 0 && (
                    <ul className="space-y-1">
                        {items.map((item) => (
                            <li
                                key={item._id}
                                className={`group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-150 min-h-[68px] ${processingId === item._id ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center overflow-hidden">
                                    {item.thumbnail && !item.thumbnail.includes('/placeholder-') ? (
                                        <Image src={item.thumbnail.startsWith('http') ? item.thumbnail : `${process.env.NEXT_PUBLIC_CREATOR_URL || ''}${item.thumbnail}`} alt="" width={24} height={24} className="object-contain w-6 h-6" />
                                    ) : (
                                        item.type === 'book'
                                            ? <Folder className="w-5 h-5 text-blue-500 dark:text-blue-400"/>
                                            : <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={item.title}>
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`Trashed: ${new Date(item.updatedAt).toLocaleString()}`}>
                                        {item.type === 'book' ? 'Book' : 'Content'} - Trashed {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                                    </p>
                                </div>

                                <div className="ml-auto flex items-center space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {/* Restore Button */}
                                    <Button
                                        variant="ghost" size="icon"
                                        className="rounded-full h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                                        title="Restore"
                                        onClick={() => handleRestore(item)}
                                        disabled={!!processingId}
                                    >
                                        {processingId === item._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Undo className="h-4 w-4" />}
                                    </Button>

                                    {/* Permanent Delete Button */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button
                                                variant="ghost" size="icon"
                                                className="rounded-full h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                title="Delete Permanently"
                                                disabled={!!processingId}
                                             >
                                                <Trash2 className="h-4 w-4" />
                                             </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white dark:bg-slate-800">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2 dark:text-gray-100">
                                                    <AlertTriangle className="h-5 w-5 text-red-500"/>
                                                    Delete Permanently?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="dark:text-gray-300">
                                                    Are you sure you want to permanently delete "{item.title}"?
                                                    {item.type === 'book' && " All content and sub-folders within this book will also be permanently deleted."}
                                                     This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600" disabled={processingId === item._id}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                     className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
                                                     onClick={(e) => {
                                                         e.preventDefault();
                                                         handlePermanentDelete(item);
                                                     }}
                                                     disabled={!!processingId}
                                                  >
                                                    {processingId === item._id ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null}
                                                    {processingId === item._id ? 'Deleting...' : 'Delete Permanently'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
        </div>
    );
}