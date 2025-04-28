"use client"

import type React from "react"
import { useNode } from "@craftjs/core"
import { ResizableElement } from "@/components/Resizer";

export interface ImageProps {
  src?: string
  alt?: string
  // Use 'number' for x/y/width/height in the props interface,
  // as react-rnd deals with numbers.
  x?: number,
  y?: number,
  width: number,
  height: number,
}

// Remove the CustomImageComponent interface, not strictly necessary here
export const ImageComponent: React.FC<ImageProps> & { craft?: any } = ({
  src = "/placeholder.svg",
  alt = "",
  // Ensure these default values are used if not provided by Craft
  // Note: Craft will typically provide them from its own props.
  x = 0,
  y = 0,
  width = 200,
  height = 150,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions, // actions from useNode are for manipulating the node itself
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    // ResizableElement handles the absolute positioning and resizing
    <ResizableElement>
      <div
        // Connect drag handler to this div
        ref={(ref) => { connect(drag(ref!)); }}
        // Basic styling for the selected state
        className={`w-full h-full ${selected ? "outline outline-2 outline-blue-500" : ""}`}
        // Styles handled by ResizableElement based on node props
        // Use w-full h-full inside ResizableElement to fill its container
      >
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          // Make the image fill the container provided by ResizableElement
          className="h-full w-full object-contain"
          draggable={false} // Prevent dragging the image itself
        />
        {selected && (
          <>
            <button
              className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs z-10"
              onClick={() => actions.setHidden(true)} // This hides the node, use editorActions.delete(id) for proper deletion
            >
              Hide
            </button>
             {/* Better: Use editorActions.delete(id) from useEditor */}
             {/* <Button
               variant="destructive"
               size="icon"
               className="absolute top-2 right-2 z-20"
               onClick={() => editorActions.delete(id)}
             >
               <Trash2 className="h-4 w-4" />
             </Button> */}
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
    width: 400,
    height: 300,
  },
  rules: {
    canDrag: true,
  },
  displayName: "Image", // Add displayName for clarity
}