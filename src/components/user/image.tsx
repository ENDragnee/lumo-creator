"use client"

import type React from "react"
import { useNode } from "@craftjs/core"
import { ResizableElement } from "@/components/Resizer";

export interface ImageProps {
  src?: string
  alt?: string
  x?: Number,
  y?: Number,
  width: Number,
  height: number,
}

interface CustomImageComponent extends React.FC<ImageProps> {
  craft: {
    props: ImageProps;
    rules: {
      canDrag: boolean;
    };
  };
}

export const ImageComponent: CustomImageComponent = ({ src = "/placeholder.svg", alt = ""}, x = 0, y = 0, width = "auto", height = "auto") => {
  const {
    connectors: { connect, drag },
    selected,
    actions,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

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
        <img src={src || "/placeholder.svg"} alt={alt} className="h-full w-full object-contain" draggable={false} />
        {selected && (
          <>
            <button className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs" onClick={() => actions.setHidden(true)}>
              Delete
            </button>
          </>
        )}
      </div>
    </ResizableElement>
  )
}

ImageComponent.craft = {
  props: {
    src: "/placeholder.svg",
    alt: "",
    x: 0,
    y: 0,
    width: 200,
    height: 150,
  },
  rules: {
    canDrag: true,
  },
}

