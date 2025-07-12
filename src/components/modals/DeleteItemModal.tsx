// @/components/modals/DeleteItemModal.tsx
"use client";

import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { DriveItem } from '@/types/drive';

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
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            Move to Trash?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground pt-2 text-base">
            {descriptionText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 flex-col-reverse sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Moving..." : "Move to Trash"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
