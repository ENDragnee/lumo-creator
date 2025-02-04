"use client"

import { useState, useCallback } from "react"
import { useNode } from "@craftjs/core"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DragDropFile } from "@/components/drag-drop-file"

interface ImageWidgetProps {
  src?: string
  alt?: string
}

export function ImageWidget({ src: initialSrc = "", alt: initialAlt = "Image" }: ImageWidgetProps) {
  const [src, setSrc] = useState<string>(initialSrc)
  const [alt, setAlt] = useState<string>(initialAlt)

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
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} className="relative min-w-[200px] min-h-[200px]">
      <DragDropFile onFileDrop={handleFileDrop} accept={{ "image/*": [] }}>
        {src ? (
          <Image src={src || "/placeholder.svg"} alt={alt} layout="fill" objectFit="contain" />
        ) : (
          <p>Drag and drop an image here, or click to select a file</p>
        )}
      </DragDropFile>
      <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="image-upload" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => document.getElementById("image-upload")?.click()}
        className="absolute bottom-2 right-2"
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

