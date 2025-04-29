// components/user/image.tsx
"use client"

import React from "react"
import { useNode, useEditor, Node } from "@craftjs/core"
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { Trash2 } from "lucide-react";
import { ImageSettings } from "@/components/settings/ImageSettings"; // Settings component (created below)
import { StackResizableWrapper } from '@/components/StackResizableWrapper';

// Props Interface
export interface ImageProps {
  src?: string;
  alt?: string;
  width?: string | number;
  height?: string | number; // Allow specific height for images
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  padding?: string | number;
}

// Craftable Component Interface
interface CraftableImageComponent extends React.FC<ImageProps> {
  craft?: {
    displayName: string;
    props: Partial<ImageProps>;
    related?: {
      settings: React.ComponentType<any>;
    };
    rules?: {
      canDrag?: (node: Node) => boolean;
    };
  };
}

export const ImageComponent: CraftableImageComponent = ({
  src = "/placeholder.svg",
  alt = "Image placeholder",
  objectFit = 'contain',
  padding = "0px",
  // width/height props are read by useNode/StackResizableWrapper
}) => {
  const {
    connectors: { connect, drag }, // Connectors applied to the draggable root
    id,
  } = useNode((node) => ({
    id: node.id,
  }));

  // Use useEditor hook to get selected state and editor actions/state
   const { selected, actions: editorActions, enabled: editorEnabled } = useEditor((state, query) => ({
      selected: query.getEvent('selected').contains(id), // Check if this specific node is selected
      enabled: state.options.enabled,
  }));

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    editorActions.delete(id);
  };

  // Styles
  const rootStyle: React.CSSProperties = {
      position: 'relative', // Base positioning context
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative', // Position context for image and button
  };

  const imageStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: objectFit,
  };

  return (
    // Apply connectors to the outermost div that should be dragged
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={rootStyle}
         className={`relative ${editorEnabled ? 'cursor-grab' : 'cursor-default'}`}
         title={editorEnabled ? "Drag to reorder" : ""}
    >
      <StackResizableWrapper
          nodeId={id}
          enableWidthResize={true}
          enableHeightResize={true} // Allow arbitrary height for images
          aspectRatio={null} // No forced aspect ratio
          minWidth={50}
          minHeight={50}
      >
        {/* This div receives the 100% width/height from wrapper */}
        <div style={contentStyle} className="rounded"> {/* Added rounded class */}
            <img
              src={src || "/placeholder.svg"}
              alt={alt}
              style={imageStyle}
              draggable={false}
            />

            {/* Delete Button - Positioned relative to the content div */}
            {selected && editorEnabled && (
                <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 z-20 h-5 w-5 opacity-80 hover:opacity-100"
                onMouseDown={(e) => e.stopPropagation()} // Prevent starting drag/resize
                onClick={handleRemove}
                aria-label="Delete Image Element"
                />
            )}
        </div>
      </StackResizableWrapper>
    </div>
  )
}

ImageComponent.craft = {
  displayName: "Image",
  props: {
    src: "/placeholder.svg",
    alt: "Placeholder Image",
    width: "300px", // Initial pixel width
    height: "200px", // Initial pixel height
    objectFit: 'contain',
    padding: "0px",
  } satisfies Partial<ImageProps>,
  related: {
      settings: ImageSettings, // Link to the Settings component
  },
  rules: {
    canDrag: () => true, // Allow dragging this component
  },
};