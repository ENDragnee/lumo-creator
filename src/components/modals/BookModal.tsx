// @/components/modals/BookModal.tsx
"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus, Tag, Loader2 } from 'lucide-react';

interface BookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  parentId: string | null;
}

export const BookModal: React.FC<BookModalProps> = ({ open, onOpenChange, onSuccess, parentId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setTitle("");
    setDescription("");
    setProcessing(false);
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
        setError("Title is required.");
        return;
    }
    setProcessing(true);
    setError(null);

    try {
      const bookPayload = { title, description, parentId };
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create book.");
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Error creating book:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border rounded-lg shadow-2xl">
        <DialogHeader className="p-6">
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <FolderPlus className="h-6 w-6 text-blue-500" />
            Create New Book
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Books act like folders to help you organize your content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="book-title" className="font-medium">Title</Label>
            <Input id="book-title" placeholder="e.g., My Novel Drafts" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-description" className="font-medium">Description (Optional)</Label>
            <Textarea id="book-description" placeholder="A brief summary of what's inside..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <DialogFooter className="pt-4 !justify-between gap-2 flex-col-reverse sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={processing}>Cancel</Button>
            <Button type="submit" disabled={processing || !title} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
              {processing ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
