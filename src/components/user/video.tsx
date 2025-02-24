"use client"

import { useNode, useEditor } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { ResizableElement } from "@/components/Resizer";


interface VideoComponentProps {
  src: string
}

export function VideoComponent({ src }: VideoComponentProps, x = 0, y = 0, width = "auto", height = "auto") {
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
    <ResizableElement>

      <div
        ref={(ref) => { connect(drag(ref!)); }}
        className={`absolute ${selected ? "outline outline-2 outline-blue-500" : ""}`}
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
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
    </ResizableElement>
  )
}

VideoComponent.craft = {
  displayName: "Video",
  props: {
    src: "",
    x: 0,
    y: 0,
    width: 200,
    height: 150,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
}

