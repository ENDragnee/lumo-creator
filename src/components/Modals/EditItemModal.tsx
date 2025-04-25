// components/EditItemModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import Image from "next/image";
import { Edit as EditIcon, Image as ImageIcon, Loader2, Save, Folder, Tag } from "lucide-react"; // Icons

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { // Define more specific item type if needed
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string; // URL or path
    // Add other editable fields like description, tags, etc.
    description?: string;
    tags?: string[];
    genre?: string;
  } | null;
  onSave: (id: string, type: "book" | "content", data: any) => Promise<void>; // Make async
}

export function EditItemModal({ open, onOpenChange, item, onSave }: EditItemModalProps) {
  // State for editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // For books
  const [tags, setTags] = useState(""); // Comma-separated string for input
  const [genre, setGenre] = useState(""); // For books

  // State for thumbnail handling (only for content)
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      if (item.type === 'book') {
          setDescription(item.description || "");
          setGenre(item.genre || "");
      } else {
          // Content specific
          setCurrentThumbnailUrl(item.thumbnail);
          setThumbnailPreview(item.thumbnail); // Show current thumbnail initially
      }
      setTags(item.tags?.join(", ") || ""); // Convert array to comma-separated string
      setThumbnailFile(null); // Reset file input on item change
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      // Reset everything if item becomes null (modal closed)
      setTitle("");
      setDescription("");
      setGenre("");
      setTags("");
      setCurrentThumbnailUrl(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setProcessing(false);
    }
  }, [item]);

   // Reset state completely on open/close, ensures clean state if reopened quickly
   const handleOpenChange = (isOpen: boolean) => {
       if (!isOpen) {
           // Explicitly reset all state related to the form
           setTitle("");
           setDescription("");
           setGenre("");
           setTags("");
           setCurrentThumbnailUrl(null);
           setThumbnailFile(null);
           setThumbnailPreview(null);
           setProcessing(false);
           if (fileInputRef.current) fileInputRef.current.value = "";
       }
       onOpenChange(isOpen);
   };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && item?.type === 'content') {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
        setCurrentThumbnailUrl(null); // Clear the old URL display if new file selected
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      // Restore original preview if file selection is cancelled
      setThumbnailPreview(item?.thumbnail || null);
    }
  };

   const triggerFileInput = () => {
       fileInputRef.current?.click();
   };

  const handleSubmit = async () => {
    if (!item || !title) return;

    setProcessing(true);
    let finalThumbnailUrl = item.thumbnail; // Start with existing

    try {
        // --- Thumbnail Upload (only if a new file was selected for content) ---
        if (thumbnailFile && item.type === 'content') {
            const formData = new FormData();
            formData.append("file", thumbnailFile);
            // Add userId if needed by API
            // formData.append("userId", userId);

            const res = await fetch("/api/upload-thumbnail", { method: "POST", body: formData });
            const result = await res.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to upload new thumbnail.");
            }
            finalThumbnailUrl = result.imageUrl; // Update with new URL
        }

        // --- Prepare Data for Save ---
        const dataToSave: any = { title };
        if (item.type === 'content') {
            // Only include thumbnail if it was successfully uploaded or wasn't changed
            if (finalThumbnailUrl !== item.thumbnail || !thumbnailFile) {
                 dataToSave.thumbnail = finalThumbnailUrl;
            }
             dataToSave.tags = tags.split(",").map(t => t.trim()).filter(Boolean);
            // Add other content-specific fields if editable (institution, subject)
        } else { // item.type === 'book'
            dataToSave.description = description || undefined;
            dataToSave.genre = genre || undefined;
            dataToSave.tags = tags.split(",").map(t => t.trim()).filter(Boolean);
            // Books might not have thumbnail updated here, or use a fixed one
            // dataToSave.thumbnail = "/icons/folder-thumbnail.svg"; // Or don't send it if it's fixed
        }


        // --- Call External Save Function ---
        await onSave(item._id, item.type, dataToSave);

        // handleOpenChange(false); // Let onSave handle closing if successful

    } catch (error: any) {
        console.error("Error updating item:", error);
        alert(`Error: ${error.message || "An unknown error occurred."}`);
        setProcessing(false); // Keep modal open on error
    }
     // Keep processing until success or error shown
     // setProcessing(false);
  };

  if (!item) return null; // Render nothing if no item

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <EditIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            Edit {item.type === "book" ? "Book" : "Content"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-1">
            Make changes to "{item.title}".
          </DialogDescription>
        </DialogHeader>

        {/* Form Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {/* Title */}
            <div className="space-y-1">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="dark:bg-slate-800 dark:border-slate-600"
                />
            </div>

            {/* Thumbnail (Content Only) */}
            {item.type === 'content' && (
                 <div className="space-y-1">
                    <Label>Thumbnail</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="dark:border-slate-600 dark:hover:bg-slate-800"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {thumbnailFile ? "Change Image" : "Upload New"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {thumbnailPreview && (
                        <Image
                          // Use process.env if needed for external URLs
                          src={thumbnailPreview.startsWith('http') || thumbnailPreview.startsWith('data:') ? thumbnailPreview : `${process.env.NEXT_PUBLIC_CREATOR_URL || ''}${thumbnailPreview}`}
                          alt="Thumbnail Preview"
                          width={64}
                          height={64}
                          className="object-cover rounded border border-slate-300 dark:border-slate-600"
                          onError={() => setThumbnailPreview('/placeholder-file.png')} // Fallback image
                        />
                      )}
                    </div>
                     {thumbnailFile && (
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]">
                           Selected: {thumbnailFile.name}
                         </p>
                     )}
                 </div>
            )}

             {/* Display Icon for Books */}
             {item.type === 'book' && (
                  <div className="space-y-1">
                     <Label>Icon</Label>
                     <div className="flex items-center gap-2 p-2 rounded border border-dashed border-slate-300 dark:border-slate-600 w-fit">
                         <Folder className="w-6 h-6 text-blue-500 dark:text-blue-400"/>
                         <span className="text-sm text-slate-600 dark:text-slate-400">Book Folder</span>
                     </div>
                  </div>
             )}


            {/* Description (Book Only) */}
            {item.type === 'book' && (
                <div className="space-y-1">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
            )}

             {/* Tags (Common) */}
             <div className="space-y-1">
                <Label htmlFor="edit-tags">Tags</Label>
                 <div className="relative">
                    <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="edit-tags"
                      placeholder="Comma-separated tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                    />
                 </div>
              </div>

            {/* Genre (Book Only) */}
            {item.type === 'book' && (
                <div className="space-y-1">
                    <Label htmlFor="edit-genre">Genre</Label>
                     <div className="relative">
                        <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="edit-genre"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                        />
                     </div>
                </div>
            )}

            {/* Add other editable fields similarly */}

        </div>


        <DialogFooter className="px-6 pb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
                  Cancel
              </Button>
            <Button
                type="button"
                onClick={handleSubmit}
                disabled={processing || !title}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
            >
                {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {processing ? "Saving..." : "Save Changes"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}