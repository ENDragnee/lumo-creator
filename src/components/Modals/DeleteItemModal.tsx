// components/DeleteItemModal.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

// --- UPDATED: Import DriveItem from its definition location ---
// Assuming DriveItem is defined in the parent or a shared types file
// If not, redefine it here or import appropriately.
// Example redefinition (use import if possible):
interface DriveItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
    parentId: string | null;
    updatedAt: string;
    // Add other fields if they exist on DriveItem
    description?: string;
    tags?: string[];
    genre?: string;
}


interface DeleteItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // --- UPDATED: Use the full DriveItem type ---
  item: DriveItem | null;
  // --- UPDATED: Callbacks expect the full DriveItem type ---
  onTrash: (item: DriveItem) => Promise<void>;
  onDelete: (item: DriveItem) => Promise<void>;
  isProcessing: boolean;
}

export const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
  open,
  onOpenChange,
  item, // item is now potentially DriveItem | null
  onTrash,
  onDelete,
  isProcessing,
}) => {
  // Null check remains the same
  if (!item) return null;

  const handleTrashClick = async () => {
    // No change needed here, 'item' is already the correct type
    await onTrash(item);
  };

  const handleDeleteClick = async () => {
    // No change needed here, 'item' is already the correct type
    await onDelete(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Content remains the same, it uses item.type and item.title */}
      <DialogContent className=" bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Delete {item.type === 'book' ? 'Book' : 'Content'}?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-2">
            Are you sure you want to proceed with deleting "{item.title}"?
            <br />
            Moving to Trash allows recovery later. Permanent deletion cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 px-6 pb-6 pt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isProcessing}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="secondary"
            onClick={handleTrashClick}
            disabled={isProcessing}
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-700/30 dark:text-yellow-300 dark:hover:bg-yellow-700/40"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Move to Trash
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};