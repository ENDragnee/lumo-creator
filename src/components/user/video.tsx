"use client"

import { useNode, useEditor } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface VideoComponentProps {
  src: string
}

export function VideoComponent({ src }: VideoComponentProps) {
  const {
    connectors: { connect, drag },
    id,
  } = useNode()
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").last()
    return {
      selected: currentNodeId === id,
    }
  })

  const handleRemove = () => {
    actions.delete(id)
  }

  return (
    <div
      ref={(ref) => {
        connect(drag(ref!));
      }}
      className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
    >
      <video src={src} controls className="w-full h-full" />
      {selected && (
        <>
          <ResizeHandle />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

VideoComponent.craft = {
  displayName: "Video",
  props: {
    src: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
}

