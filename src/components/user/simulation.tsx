"use client"
import React from "react";
import { ResizableElement } from "@/components/Resizer";
import { useNode, useEditor } from "@craftjs/core";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SimulationProps {
  src: string;
  // These are props used by ResizableElement and saved by Craft
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface CraftableComponent extends React.FC<SimulationProps> {
  craft?: {
    displayName: string;
    props: Record<string, any>;
    rules: {
      canDrag: () => boolean;
      canDrop: () => boolean;
      canMoveIn: () => boolean;
      canMoveOut: () => boolean;
    };
  };
}

export const SimulationComponent: CraftableComponent = ({
  src,
  // Note: x, y, width, height are handled by ResizableElement via useNode props
}) => {
  const {
    connectors: { connect, drag },
    selected,
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    // nodeWidth: node.data.props.width, // Use the props passed to ResizableElement instead
    // nodeHeight: node.data.props.height
  }));

  // Use editor actions for deletion functionality
  const { actions: editorActions } = useEditor();

  const handleRemove = () => {
    editorActions.delete(id);
  };

  return (
    // ResizableElement handles size and position
    <ResizableElement>
      <div 
        className={`relative w-full h-full ${selected ? "outline outline-2 outline-blue-500" : ""}`}
      >
        {/* Transparent overlay for drag handling */}
        <div
          ref={(ref) => {
            if (ref) {
              connect(drag(ref));
            }
          }}
          className="absolute inset-0 z-10 cursor-move"
          style={{ 
            background: "transparent"
          }}
        />
        
        {selected && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-20"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {/* The iframe itself fills the container */}
        <iframe
          src={src}
          className={`w-full h-full rounded-md ${selected ? "pointer-events-auto" : "pointer-events-none"}`}
          style={{
            display: "block",
            border: "none", // Usually remove border for clean embeds
          }}
        ></iframe>
      </div>
    </ResizableElement>
  );
};

SimulationComponent.craft = {
  displayName: "Simulation",
  props: {
    src: "",
    x: 0, // These props will be set by ResizableElement
    y: 0,
    width: 400, // Default size for the editor
    height: 300,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true, // If you want to drop things *into* simulation? Unlikely.
    canMoveOut: () => true,
  },
};