"use client"

import { useState } from "react"
import { Rnd } from "react-rnd"
import { useMedia } from "./media-context"

type ResizableElementProps = {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  url: string
}

export function ResizableElement({ id, type, x, y, width, height, url }: ResizableElementProps) {
  const { updateCanvasElement } = useMedia()
  const [isSelected, setIsSelected] = useState(false)

  return (
    <Rnd
      default={{
        x,
        y,
        width,
        height,
      }}
      minWidth={100}
      minHeight={100}
      bounds="parent"
      onDragStop={(e, d) => {
        updateCanvasElement(id, {
          x: d.x,
          y: d.y,
        })
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateCanvasElement(id, {
          width: Number.parseInt(ref.style.width),
          height: Number.parseInt(ref.style.height),
          x: position.x,
          y: position.y,
        })
      }}
      onClick={() => setIsSelected(true)}
      onMouseLeave={() => setIsSelected(false)}
      className={`group ${isSelected ? "ring-2 ring-blue-500" : ""}`}
    >
      {type === "image" && (
        <img src={url || "/placeholder.svg"} alt="" className="h-full w-full object-contain" draggable={false} />
      )}
      {isSelected && (
        <div className="absolute inset-0 hidden group-hover:block">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button className="rounded bg-white p-1 text-xs shadow-sm">Edit</button>
            <button className="rounded bg-white p-1 text-xs shadow-sm">Delete</button>
          </div>
        </div>
      )}
    </Rnd>
  )
}

