"use client"

import { useState, useCallback } from "react"
import { useNode } from "@craftjs/core"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DragDropFile } from "@/components/drag-drop-file"
import { Upload, ImageIcon } from "lucide-react"

interface ImageWidgetProps {
  src?: string
  alt?: string
}

export function ImageWidget({ src: initialSrc = "", alt: initialAlt = "Image" }: ImageWidgetProps) {
  const [src, setSrc] = useState<string>(initialSrc)
  const [alt, setAlt] = useState<string>(initialAlt)
  const [isDragging, setIsDragging] = useState(false)

  const {
    connectors: { connect, drag },
  } = useNode()

  const handleFileDrop = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setSrc(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileDrop(file)
      }
    },
    [handleFileDrop],
  )

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      className="relative min-w-[200px] min-h-[200px] rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out"
    >
      <DragDropFile
        onFileDrop={handleFileDrop}
        accept={{ "image/*": [] }}
      >
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 transition-all duration-300 ease-in-out ${isDragging ? "scale-105 opacity-80" : ""}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        >
          {src ? (
            <Image src={src || "/placeholder.svg"} alt={alt} layout="fill" objectFit="cover" className="rounded-lg" />
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Drag and drop an image here, or click to select a file</p>
            </div>
          )}
          <div
            className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-0"}`}
          >
            <Upload className="h-16 w-16 text-white animate-bounce" />
          </div>
        </div>
      </DragDropFile>
      <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="image-upload" />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => document.getElementById("image-upload")?.click()}
        className="absolute bottom-2 right-2 bg-white bg-opacity-75 hover:bg-opacity-100 transition-all duration-300 ease-in-out"
      >
        Browse
      </Button>
    </div>
  )
}

export const CraftImageWidget = ({ src, alt }: ImageWidgetProps) => {
  return <ImageWidget src={src || "/placeholder.svg"} alt={alt} />
}

CraftImageWidget.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "Image",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
}