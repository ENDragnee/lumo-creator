// components/BookModal.tsx
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
import { FolderPlus, Tag, Type, Loader2 } from 'lucide-react'; // Icons

interface BookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>; // Make async if onSave is async
}

export const BookModal: React.FC<BookModalProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [genre, setGenre] = useState("");
  const [processing, setProcessing] = useState(false);

  // Reset state when modal closes
  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          setTitle("");
          setDescription("");
          setTags("");
          setGenre("");
          setProcessing(false);
      }
      onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const tagArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      await onSave({ // Await if onSave returns a promise
        type: "book",
        title,
        description: description || undefined,
        thumbnail: "/icons/folder-thumbnail.svg", // Use a consistent placeholder/icon path
        tags: tagArray,
        genre: genre || undefined,
      });
      // No need to reset here, handleOpenChange(false) will do it
      // onOpenChange(false); // onSave might handle closing
    } catch (error: any) {
      console.error("Error creating book:", error);
      alert(`Error: ${error.message || "An unknown error occurred."}`);
      setProcessing(false); // Keep modal open on error
    }
    // setProcessing(false); // Keep processing until modal closes or error
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
             <FolderPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Create New Book (Folder)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-1">
            Books act like folders to organize your content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="book-title">Title</Label>
            <Input
              id="book-title"
              placeholder="e.g., Project Alpha Chapters"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="dark:bg-slate-800 dark:border-slate-600"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="book-description">Description (Optional)</Label>
            <Textarea
              id="book-description"
              placeholder="A brief summary of this book's contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="dark:bg-slate-800 dark:border-slate-600"
            />
          </div>

           {/* Tags */}
          <div className="space-y-1">
            <Label htmlFor="book-tags">Tags (Optional)</Label>
             <div className="relative">
                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="book-tags"
                  placeholder="Comma-separated, e.g., fiction, draft, chapter"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                />
             </div>
          </div>

          {/* Genre (Optional) */}
          <div className="space-y-1">
            <Label htmlFor="book-genre">Genre (Optional)</Label>
             <div className="relative">
                <Type className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="book-genre"
                  placeholder="e.g., Science Fiction"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                />
             </div>
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
                  Cancel
              </Button>
            <Button
                type="submit"
                disabled={processing || !title}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            >
               {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="mr-2 h-4 w-4" />
              )}
              {processing ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};