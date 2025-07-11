"use client";

import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

// **THE FIX**: Import the centralized, correct type.
import { DriveItem } from '@/types/drive';

// The props interface now uses the shared DriveItem type.
interface DeleteItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DriveItem | null;
  onConfirm: (item: DriveItem) => Promise<void> | void;
}

export function DeleteItemModal({ open, onOpenChange, item, onConfirm }: DeleteItemModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!item) return null;

  const handleConfirm = async () => {
    // No type error here anymore because 'item' is correctly typed as DriveItem.
    setIsProcessing(true);
    try {
      await onConfirm(item);
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  const descriptionText = `Are you sure you want to move "${item.title}" to the trash? ${item.type === 'book' ? 'Its contents will also be moved.' : ''} You can restore it later.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border rounded-lg shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Move to Trash?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground pt-2">
            {descriptionText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isProcessing ? "Moving..." : "Move to Trash"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
