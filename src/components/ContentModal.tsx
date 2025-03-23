"use client";
import React, { useState, ChangeEvent } from "react";
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

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  // Optionally pass a userId as prop:
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
  const [tags, setTags] = useState("");
  const [institution, setInstitution] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a file was selected
    if (!thumbnailFile) {
      alert("Please select a thumbnail file.");
      return;
    }

    setUploading(true);
    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("file", thumbnailFile);
      formData.append("userId", userId);

      const res = await fetch("/api/upload-thumbnail", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Failed to upload thumbnail.");
        setUploading(false);
        return;
      }

      const thumbnail = result.imageUrl;
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      onSave({
        type: "content",
        title,
        thumbnail,
        tags: tagArray,
        institution,
        subject,
      });

      // Optionally clear fields here
      setTitle("");
      setThumbnailFile(null);
      setTags("");
      setInstitution("");
      setSubject("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      alert("An error occurred while uploading the thumbnail.");
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-300 p-4 rounded flex flex-col">
        <DialogHeader>
          <DialogTitle>New Content</DialogTitle>
          <DialogDescription>
            Enter the details for your new content.
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
            {/* File input for thumbnail */}
            <div>
              <label className="block mb-1">Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="border border-gray-400 p-2 rounded w-full"
              />
            </div>
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Input
              placeholder="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Create Content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
