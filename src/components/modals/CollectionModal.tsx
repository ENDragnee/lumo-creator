"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus, Loader2, AlertTriangle } from "lucide-react";

interface CollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  parentId: string | null;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  parentId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resets the form state when the modal is closed or submission is successful
  const resetState = () => {
    setTitle("");
    setDescription("");
    setProcessing(false);
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setProcessing(true);
    setError(null);

    try {
      // Renamed for clarity
      const collectionPayload = { title, description, parentId };
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        // Updated error message
        throw new Error(errData.message || "Failed to create collection.");
      }

      onSuccess(); // Triggers a re-fetch or UI update in the parent
      handleOpenChange(false); // Closes the modal
    } catch (err: any) {
      // Updated error message
      console.error("Error creating collection:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FolderPlus className="h-7 w-7 text-blue-500" />
            Create New Collection
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Collections act like folders to help you organize your content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {/* Updated id and htmlFor */}
              <Label htmlFor="collection-title" className="font-medium text-sm">
                Title
              </Label>
              <Input
                id="collection-title"
                placeholder="e.g., Introduction to JavaScript"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              {/* Updated id and htmlFor */}
              <Label htmlFor="collection-description" className="font-medium text-sm">
                Description (Optional)
              </Label>
              <Textarea
                id="collection-description"
                placeholder="A brief summary of what this collection contains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="p-6 mt-2 border-t flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="w-full sm:w-auto sm:max-w-xs">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive font-medium p-2 rounded-md bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end w-full sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={processing}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing || !title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FolderPlus className="mr-2 h-4 w-4" />
                )}
                {processing ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
