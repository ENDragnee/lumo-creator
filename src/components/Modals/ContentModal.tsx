// components/ContentModal.tsx
"use client";
import React, { useState, ChangeEvent, useRef } from "react";
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
import { Label } from "@/components/ui/label"; // Import Label
import Image from 'next/image';
import { FilePlus, Image as ImageIcon, Tag, Building, Book as BookIcon, Loader2 } from 'lucide-react'; // Icons

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>; // Make async if onSave is async
  userId: string;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  open,
  onOpenChange,
  onSave,
  userId,
}) => {
  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [institution, setInstitution] = useState("");
  const [subject, setSubject] = useState("");
  const [processing, setProcessing] = useState(false); // Renamed from uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset state when modal closes
  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          setTitle("");
          setThumbnailFile(null);
          setThumbnailPreview(null);
          setTags("");
          setInstitution("");
          setSubject("");
          setProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      }
      onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnailFile) {
      alert("Please select a thumbnail image.");
      return;
    }
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", thumbnailFile);
      formData.append("userId", userId); // Pass userId if needed by API

      const res = await fetch("/api/upload-thumbnail", { // Make sure this API exists and works
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to upload thumbnail.");
      }

      const thumbnail = result.imageUrl; // Get URL from API response
      const tagArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);

      await onSave({ // Await if onSave returns a promise
        type: "content",
        title,
        thumbnail,
        tags: tagArray,
        institution: institution || undefined, // Send undefined if empty
        subject: subject || undefined, // Send undefined if empty
        // Add other fields if needed by onSave
      });

      // No need to reset here, handleOpenChange(false) will do it
      // onOpenChange(false); // onSave might handle closing

    } catch (error: any) {
      console.error("Error creating content:", error);
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
            <FilePlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Create New Content
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-1">
            Fill in the details for your new content item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="content-title">Title</Label>
            <Input
              id="content-title"
              placeholder="e.g., Introduction to React Hooks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="dark:bg-slate-800 dark:border-slate-600"
            />
          </div>

          {/* Thumbnail */}
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
                {thumbnailFile ? "Change Image" : "Upload Image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp" // Be specific
                onChange={handleFileChange}
                className="hidden" // Hide the default input
                required={!thumbnailPreview} // Required only if no preview exists (i.e., initial state)
              />
              {thumbnailPreview && (
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  width={64}
                  height={64}
                  className="object-cover rounded border border-slate-300 dark:border-slate-600"
                />
              )}
               {thumbnailFile && !thumbnailPreview && ( // Show filename if preview isn't ready yet
                 <span className="text-xs text-slate-500 truncate max-w-[150px]">
                   {thumbnailFile.name}
                 </span>
               )}
            </div>
              {!thumbnailFile && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recommended: 16:9 aspect ratio.</p>}
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label htmlFor="content-tags">Tags</Label>
            <div className="relative">
              <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="content-tags"
                placeholder="Comma-separated, e.g., react, javascript, webdev"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="pl-8 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Institution & Subject (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="content-institution">Institution (Optional)</Label>
               <div className="relative">
                   <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                   <Input
                     id="content-institution"
                     placeholder="e.g., University Name"
                     value={institution}
                     onChange={(e) => setInstitution(e.target.value)}
                     className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                   />
               </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="content-subject">Subject (Optional)</Label>
              <div className="relative">
                  <BookIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="content-subject"
                    placeholder="e.g., Computer Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="pl-8 dark:bg-slate-800 dark:border-slate-600"
                  />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
             {/* Cancel Button */}
             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
                  Cancel
              </Button>
            <Button
                type="submit"
                disabled={processing || !title || !thumbnailFile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
             >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2 h-4 w-4" />
              )}
              {processing ? "Creating..." : "Create Content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};