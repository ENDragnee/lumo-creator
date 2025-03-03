"use client"

import { useEditor } from "@craftjs/core"
import { ImageComponent } from "@/components/user/image"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageItem {
  filename: string
  imageUrl: string
  
}

interface ImageListProps {
  images: ImageItem[]
  onRemove: (filename: string) => void
}

export function ImageList({ images, onRemove }: ImageListProps) {
  const { connectors } = useEditor()

  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">Your Images</h3>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(ref, <ImageComponent src={image.imageUrl || "/placeholder.svg"} width={160} height={120} />)
                }
              }}
              className="cursor-move"
            >
              <Image
                src={image.imageUrl || "/placeholder.svg"}
                alt={`Image ${image.filename}`}
                width={160}
                height={120}
                className="w-full h-24 object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                <span className="text-white text-sm">Drag to add</span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(image.filename)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

