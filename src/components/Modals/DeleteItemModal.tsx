// components/Modals/DeleteItemModal.tsx
import React from 'react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

// Match the DriveItem interface used in DriveHomeRedesigned
interface DriveItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;       // <-- Add this
    parentId: string | null; // <-- Add this
    updatedAt: string;       // <-- Add this
    createdAt: string;       // <-- Add this
    data?: string;    
    // Add other fields if needed by the modal's logic/display
}

interface DeleteItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: DriveItem | null;
    onTrash: (item: DriveItem) => Promise<void> | void; // Renamed to onTrash for clarity
    isProcessing: boolean;
    // Props for customization from DriveHomeRedesigned
    titleText?: string;
    descriptionText?: string;
    actionButtonText?: string;
}

export function DeleteItemModal({
    open,
    onOpenChange,
    item,
    onTrash, // Use the clearer prop name
    isProcessing,
    titleText = "Move Item to Trash?", // Default title
    descriptionText, // Will be constructed or passed in
    actionButtonText = "Move to Trash" // Default action text
}: DeleteItemModalProps) {

    if (!item) return null;

    // Construct default description if not provided
    const finalDescription = descriptionText || `Are you sure you want to move "${item.title}" to the trash? ${item.type === 'book' ? 'Contents will also be moved.' : ''} You can restore it later from the Trash view.`;

    const handleConfirm = () => {
        onTrash(item); // Directly call the trash handler
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white dark:bg-slate-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 dark:text-gray-100">
                         {/* Use warning triangle, less severe than red error for trash */}
                         <AlertTriangle className="h-5 w-5 text-yellow-500"/>
                         {titleText}
                     </AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-gray-300">
                         {finalDescription}
                     </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600" disabled={isProcessing}>Cancel</AlertDialogCancel>
                    {/* Action button calls the confirmation handler */}
                    <Button
                        // Use destructive variant for visual cue, even though it's just trash
                        variant="destructive" // Or keep default: variant="default"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white" // Explicit red style
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Moving...
                            </>
                        ) : (
                            actionButtonText
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}