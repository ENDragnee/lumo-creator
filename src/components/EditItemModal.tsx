"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
  } | null;
  onSave: (id: string, type: "book" | "content", data: any) => void;
}

export function EditItemModal({ open, onOpenChange, item, onSave }: EditItemModalProps) {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setThumbnail(item.thumbnail);
    }
  }, [item]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload-thumbnail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setThumbnail(data.imageUrl);
      } else {
        console.error("Upload failed:", data.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!item || !title) return;

    onSave(item._id, item.type, {
      title,
      thumbnail,
    });

    onOpenChange(false);
  };

  return (
    <div className="bg-gray-300 p-4 rounded flex flex-col items-center justify-center">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-200 rounded-xl p-8">
          <DialogHeader>
            <DialogTitle className="bg-gray-300 p-4 rounded-lg">Edit {item?.type === "book" ? "Book" : "Content"}</DialogTitle>
            <DialogDescription className="bg-gray-300 p-4 rounded-lg">
              Update the details for your {item?.type === "book" ? "book" : "content"} item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-4 bg-gray-300 rounded-lg">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Thumbnail</label>
              <div className="col-span-3">
                <Input
                  id="thumbnail"
                  type="file"
                  onChange={handleFileChange}
                />
                {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                {thumbnail && (
                  <div className="mt-2">
                    <Image
                      src={thumbnail}
                      alt="Thumbnail Preview"
                      width={100}
                      height={100}
                      className="object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-gray-300 p-4 rounded-xl items-center hover:scale-105 hover:bg-green-300" onClick={handleSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}