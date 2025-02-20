"use client";

import React, { useState } from "react";
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
import { Plus, X } from "lucide-react";

interface ContentModalProps {
  onSave: (contentData: {
    title: string;
    thumbnail: string;
    tags: string[];
    institution?: string;
    subject?: string;
  }) => void;
}

export function ContentModal({ onSave }: ContentModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [institution, setInstitution] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Replace "1" with the actual userId as needed.
    const userId = "1";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

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
    if (!title || !thumbnail) {
      // You might show a toast or error message here.
      return;
    }
    onSave({
      title,
      thumbnail,
      tags,
      institution: institution || undefined,
      subject: subject || undefined,
    });
    // Reset form and close modal.
    setTitle("");
    setThumbnail("");
    setTags([]);
    setNewTag("");
    setInstitution("");
    setSubject("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="shadow-lg hover:shadow-2xl transition-all">
          Save Content
        </Button>
      </DialogTrigger>
      <DialogContent className="transition-transform duration-200 ease-out transform scale-95 animate-fadeIn">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Content</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Fill in the details for your content before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 transition-colors"
          />
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Thumbnail</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full"
            />
            {uploading && <p>Uploading...</p>}
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Thumbnail Preview"
                className="mt-2 max-h-40 object-contain"
              />
            )}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 transition-all"
                >
                  <span>{tag}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300 transition-colors"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addTag}
                  className="ml-1 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 transition-colors"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 transition-colors"
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
