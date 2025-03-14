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
import { Textarea } from "@/components/ui/textarea";

interface BookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export const BookModal: React.FC<BookModalProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState("");
  const [genre, setGenre] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    onSave({
      type: "book",
      title,
      description,
      thumbnail,
      tags: tagArray,
      genre,
    });
    // Optionally clear fields here
    setTitle("");
    setDescription("");
    setThumbnail("");
    setTags("");
    setGenre("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-300 p-4 rounded flex flex-col">
        <DialogHeader>
          <DialogTitle>New Book</DialogTitle>
          <DialogDescription>
            Enter the details for your new book.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Thumbnail URL"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              required
            />
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Input
              placeholder="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create Book</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
