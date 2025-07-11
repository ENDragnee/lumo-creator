// @/components/modals/ContentModal.tsx
"use client";
import React, { useState, ChangeEvent, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { FilePlus, Image as ImageIcon, Tag, Loader2 } from 'lucide-react';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback on successful creation
  parentId: string | null;
}

export const ContentModal: React.FC<ContentModalProps> = ({ open, onOpenChange, onSuccess, parentId }) => {
  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file.");
        return;
      }
      setThumbnailFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setTitle("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setTags("");
    setProcessing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !thumbnailFile) {
      setError("Title and a thumbnail image are required.");
      return;
    }
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Upload the thumbnail to the media API
      const mediaFormData = new FormData();
      mediaFormData.append("file", thumbnailFile);

      const mediaRes = await fetch("/api/media", {
        method: "POST",
        body: mediaFormData,
      });

      if (!mediaRes.ok) throw new Error("Thumbnail upload failed.");
      const mediaData = await mediaRes.json();
      if (!mediaData.success || !mediaData.data._id) {
        throw new Error(mediaData.message || "Could not get thumbnail ID.");
      }
      const thumbnailId = mediaData.data._id;

      // Step 2: Create the content item with the new media ID
      const contentPayload = {
        title,
        thumbnail: thumbnailId,
        parentId: parentId,
        contentType: 'dynamic', // Or whatever default you prefer
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const contentRes = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentPayload),
      });

      if (!contentRes.ok) throw new Error("Failed to create content item.");
      
      onSuccess(); // Trigger refetch on the parent page
      handleOpenChange(false);

    } catch (err: any) {
      console.error("Error creating content:", err);
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
            <FilePlus className="h-6 w-6 text-primary" />
            Create New Content
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Fill in the details for your new masterpiece.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-title" className="font-medium">Title</Label>
            <Input id="content-title" placeholder="e.g., Introduction to Quantum Physics" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="font-medium">Thumbnail</Label>
            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {thumbnailFile ? "Change Image" : "Upload Image"}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {thumbnailPreview && <Image src={thumbnailPreview} alt="Preview" width={48} height={48} className="object-cover rounded-md border" />}
            </div>
            <p className="text-xs text-muted-foreground">A 16:9 aspect ratio looks best.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-tags" className="font-medium">Tags (Optional)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="content-tags" placeholder="Comma-separated, e.g., science, physics" value={tags} onChange={(e) => setTags(e.target.value)} className="pl-9" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <DialogFooter className="pt-4 !justify-between gap-2 flex-col-reverse sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={processing}>Cancel</Button>
            <Button type="submit" disabled={processing || !title || !thumbnailFile}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
              {processing ? "Creating..." : "Create Content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
