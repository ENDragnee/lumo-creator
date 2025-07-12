// @/components/modals/ContentModal.tsx
"use client";
import React, { useState, ChangeEvent, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { FilePlus, Tag, Loader2, UploadCloud, AlertTriangle } from 'lucide-react';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newContentId: string) => void;
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
      if (file.size > 10 * 1024 * 1024) { // 10MB size limit
        setError("File is too large. Maximum size is 10MB.");
        return;
      }
      setThumbnailFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    // Create a synthetic event to reuse the handleFileChange logic
    if(file) {
      const syntheticEvent = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
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
      const mediaFormData = new FormData();
      mediaFormData.append("file", thumbnailFile);
      const mediaRes = await fetch("/api/media", { method: "POST", body: mediaFormData });
      if (!mediaRes.ok) throw new Error("Thumbnail upload failed.");
      const mediaData = await mediaRes.json();
      if (!mediaData.success || !mediaData.data._id) throw new Error(mediaData.message || "Could not get thumbnail ID.");
      const thumbnailId = mediaData.data._id;

      const contentPayload = {
        title,
        thumbnail: thumbnailId,
        parentId: parentId,
        contentType: 'dynamic',
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const contentRes = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentPayload),
      });

      if (!contentRes.ok) {
        const errorData = await contentRes.json();
        throw new Error(errorData.message || "Failed to create content item.");
      }
      
      const result = await contentRes.json();
      if (!result.data?._id) throw new Error("API did not return a new content ID.");

      onSuccess(result.data._id);
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
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FilePlus className="h-7 w-7 text-primary" />
            Create New Content
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Fill in the details for your new masterpiece. A title and thumbnail are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="content-title" className="font-medium text-sm">Title</Label>
              <Input id="content-title" placeholder="e.g., Introduction to Quantum Physics" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload" className="font-medium text-sm">Thumbnail</Label>
              <div 
                className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <>
                    <Image src={thumbnailPreview} alt="Thumbnail Preview" layout="fill" className="object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white font-semibold">Click or drag to change</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1">PNG, JPG, or GIF (max 10MB). 16:9 recommended.</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-tags" className="font-medium text-sm">Tags (Optional)</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="content-tags" placeholder="Comma-separated, e.g., science, physics" value={tags} onChange={(e) => setTags(e.target.value)} className="pl-9" />
              </div>
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
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={processing}>Cancel</Button>
              <Button type="submit" disabled={processing || !title || !thumbnailFile}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                {processing ? "Creating..." : "Create Content"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
