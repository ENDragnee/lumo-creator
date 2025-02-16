"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DragDropFile } from "@/components/drag-drop-file"

interface ImageUploaderProps {
  onUpload: (filename: string, imageUrl: string) => void
  userId: string
}

export function ImageUploader({ onUpload, userId }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileDrop = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        onUpload(data.filename, data.imageUrl)
      } else {
        console.error("Upload failed:", data.message)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-4">
      <DragDropFile onFileDrop={handleFileDrop} accept={{ "image/*": [] }}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {uploading ? (
            <p>Uploading...</p>
          ) : (
            <>
              <p>Drag and drop an image here, or click to select a file</p>
              <Button onClick={() => document.getElementById("image-upload")?.click()} className="mt-2">
                Browse
              </Button>
            </>
          )}
        </div>
      </DragDropFile>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileDrop(e.target.files[0])}
        className="hidden"
        id="image-upload"
      />
    </div>
  )
}

