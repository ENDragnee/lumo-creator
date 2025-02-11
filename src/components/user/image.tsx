"use client"

import type React from "react"
import { useNode } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"

export interface ImageProps {
  src?: string
  alt?: string
}

interface CustomImageComponent extends React.FC<ImageProps> {
  craft: {
    props: ImageProps;
    rules: {
      canDrag: boolean;
    };
  };
}

export const ImageComponent: CustomImageComponent = ({ src = "/placeholder.svg", alt = "" }) => {
  const {
    connectors: { connect, drag },
    selected,
    actions,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  return (
    <div
      ref={(ref) => {connect(drag(ref!))}}
      className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
    >
      <img src={src || "/placeholder.svg"} alt={alt} className="h-full w-full object-contain" draggable={false} />
      {selected && (
        <>
          <ResizeHandle />
          <button className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs" onClick={() => actions.setHidden(true)}>
            Delete
          </button>
        </>
      )}
    </div>
  )
}

ImageComponent.craft = {
  props: {
    src: "/placeholder.svg",
    alt: "",
  },
  rules: {
    canDrag: true,
  },
}

