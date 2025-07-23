// @/components/modals/EditItemModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Edit as EditIcon, Image as ImageIcon, Loader2, Save, Tag, AlertTriangle } from "lucide-react";

// --- REFACTOR: Changed type from 'book' to 'collection' ---
type EditModalItem = {
  _id: string;
  type: "collection" | "content";
  title: string;
  thumbnail?: string | null;
  description?: string;
  tags?: string[];
  genre?: string;
};

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EditModalItem | null;
  onSuccess: () => void;
}

export function EditItemModal({ open, onOpenChange, item, onSuccess }: EditItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [genre, setGenre] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setGenre("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setProcessing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (item && open) {
      setTitle(item.title);
      setTags(item.tags?.join(", ") || "");
      // --- REFACTOR: Check for 'collection' type ---
      if (item.type === 'collection') {
        setDescription(item.description || "");
        setGenre(item.genre || "");
        // Note: The UI doesn't currently support changing a collection's thumbnail,
        // but it could be added here if needed.
      } else {
        // This is for 'content' type
        setThumbnailPreview(item.thumbnail || null);
      }
    } else {
      resetState();
    }
  }, [item, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && item?.type === 'content') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !title.trim()) return;

    setProcessing(true);
    setError(null);
    let newThumbnailId: string | undefined = undefined;

    try {
      if (thumbnailFile && item.type === 'content') {
        const mediaFormData = new FormData();
        mediaFormData.append("file", thumbnailFile);
        const mediaRes = await fetch("/api/media", { method: "POST", body: mediaFormData });
        if (!mediaRes.ok) throw new Error("New thumbnail upload failed.");
        const mediaData = await mediaRes.json();
        if (!mediaData.success) throw new Error(mediaData.message || "Could not get new thumbnail ID.");
        newThumbnailId = mediaData.data._id;
      }

      // --- REFACTOR: Use correct endpoint for 'collection' ---
      const endpoint = item.type === 'collection' ? `/api/collections/${item._id}` : `/api/content/${item._id}`;
      const dataToSave: any = { title };
      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      dataToSave.tags = tagArray;

      // Apply type-specific fields
      if (item.type === 'content') {
        if (newThumbnailId) dataToSave.thumbnail = newThumbnailId;
      } else { // This is for 'collection'
        dataToSave.description = description;
        dataToSave.genre = genre;
      }
      
      const updateRes = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.message || "Failed to save changes.");
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Error updating item:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <EditIcon className="h-7 w-7 text-green-500" />
            {/* --- REFACTOR: Update UI text --- */}
            Edit {item.type === 'collection' ? 'Collection' : 'Content'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1 truncate">
            Making changes to "{item.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="font-medium text-sm">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {item.type === 'content' && (
              <div className="space-y-2">
                <Label className="font-medium text-sm">Thumbnail</Label>
                <div className="flex items-end gap-4">
                  {thumbnailPreview ? (
                    <div className="relative w-40 h-[90px] rounded-md border bg-muted overflow-hidden">
                       <Image src={thumbnailPreview} alt="Current thumbnail" layout="fill" className="object-cover" />
                    </div>
                  ) : <div className="w-40 h-[90px] rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-sm">No Thumbnail</div>}
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            )}
            
            {/* --- REFACTOR: Update conditional render --- */}
            {item.type === 'collection' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="font-medium text-sm">Description (Optional)</Label>
                  <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A brief summary..."/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-genre" className="font-medium text-sm">Genre (Optional)</Label>
                  <Input id="edit-genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g., Learning, Sci-Fi"/>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-tags" className="font-medium text-sm">Tags (Optional)</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-tags" placeholder="Comma-separated tags" value={tags} onChange={(e) => setTags(e.target.value)} className="pl-9" />
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
              <Button type="submit" disabled={processing || !title.trim()} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {processing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
