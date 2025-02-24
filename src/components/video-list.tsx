"use client"

import { useEditor } from "@craftjs/core"
import { VideoComponent } from "@/components/user/video"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  filename: string
  thumbnailUrl: string
}

interface VideoListProps {
  videos: Video[]
  onRemove: (filename: string) => void
}

export function VideoList({ videos, onRemove }: VideoListProps) {
  const { connectors } = useEditor()

  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">Your Videos</h3>
      <div className="grid grid-cols-2 gap-2">
        {videos.map((video, index) => (
          <div key={index} className="relative group">
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(ref, <VideoComponent src={`/videos/${video.filename}`} />)
                }
              }}
              className="cursor-move"
            >
              <Image
                src={video.thumbnailUrl || "/placeholder.svg"}
                alt={`Thumbnail for ${video.filename}`}
                width={160}
                height={120}
                className="w-full h-24 object-cover rounded-md"
              />
              <div className="absolute inset-0  bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                <span className=" text-sm">Drag to add</span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(video.filename)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

