"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Edit as EditIcon, Image as ImageIcon, Loader2, Save, Folder, Tag } from "lucide-react";

// The item type passed from the Home page
type EditModalItem = {
  _id: string;
  type: "book" | "content";
  title: string;
  // Content items have a thumbnail string, books might not.
  thumbnail?: string | null;
  description?: string;
  tags?: string[];
  genre?: string;
}

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EditModalItem | null;
  onSuccess: () => void; // Callback to refetch data on the parent page
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

  // Reset all state fields
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

  // Populate form when the modal is opened with an item
  useEffect(() => {
    if (item && open) {
      setTitle(item.title);
      setTags(item.tags?.join(", ") || "");
      if (item.type === 'book') {
        setDescription(item.description || "");
        setGenre(item.genre || "");
      } else {
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
    if (!item || !title) return;

    setProcessing(true);
    setError(null);
    let newThumbnailId: string | undefined = undefined;

    try {
      // Step 1: If a new thumbnail file exists for a content item, upload it first.
      if (thumbnailFile && item.type === 'content') {
        const mediaFormData = new FormData();
        mediaFormData.append("file", thumbnailFile);
        const mediaRes = await fetch("/api/media", { method: "POST", body: mediaFormData });
        if (!mediaRes.ok) throw new Error("New thumbnail upload failed.");
        const mediaData = await mediaRes.json();
        if (!mediaData.success) throw new Error(mediaData.message || "Could not get new thumbnail ID.");
        newThumbnailId = mediaData.data._id;
      }

      // Step 2: Prepare the payload for the PUT request.
      const endpoint = item.type === 'book' ? `/api/books/${item._id}` : `/api/content/${item._id}`;
      const dataToSave: any = { title };
      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

      if (item.type === 'content') {
        dataToSave.tags = tagArray;
        if (newThumbnailId) {
          dataToSave.thumbnail = newThumbnailId;
        }
      } else { // item.type === 'book'
        dataToSave.description = description;
        dataToSave.genre = genre;
        dataToSave.tags = tagArray;
      }
      
      // Step 3: Send the PUT request to update the item.
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
      <DialogContent className="sm:max-w-md bg-background border rounded-lg shadow-2xl">
        <DialogHeader className="p-6">
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <EditIcon className="h-6 w-6 text-green-500" />
            Edit {item.type === 'book' ? 'Book' : 'Content'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1 truncate">
            Make changes to "{item.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="font-medium">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {item.type === 'content' && (
              <div className="space-y-2">
                <Label className="font-medium">Thumbnail</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {thumbnailPreview && <Image src={thumbnailPreview} alt="Preview" width={64} height={36} className="object-cover rounded-md border" />}
                </div>
              </div>
            )}

            {item.type === 'book' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="font-medium">Description</Label>
                  <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-genre" className="font-medium">Genre</Label>
                  <Input id="edit-genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-tags" className="font-medium">Tags</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-tags" placeholder="Comma-separated tags" value={tags} onChange={(e) => setTags(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t !justify-between gap-2 flex-col-reverse sm:flex-row">
            {error && <p className="text-sm text-destructive font-medium text-left flex-1">{error}</p>}
            <div className="flex gap-2 self-end">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={processing}>Cancel</Button>
              <Button type="submit" disabled={processing || !title} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600">
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
