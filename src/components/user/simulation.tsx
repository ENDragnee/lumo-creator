import React, { useEffect } from "react";
import { ResizableElement } from "@/components/Resizer";
import { useNode, useEditor } from "@craftjs/core";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulationProps {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export const SimulationComponent = ({ 
  src, 
  x = 0, 
  y = 0, 
  width = 200, 
  height = 300 
}: SimulationProps) => {
  const {
    connectors: { connect, drag },
    selected,
    id,
    actions,
    nodeWidth,
    nodeHeight
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    nodeWidth: node.data.props.width,
    nodeHeight: node.data.props.height
  }));

  // Use editor actions for deletion functionality
  const { actions: editorActions } = useEditor();

  // Update iframe dimensions when component is resized
  useEffect(() => {
    // This effect will run when nodeWidth or nodeHeight changes
    actions.setProp((props: any) => {
      props.width = nodeWidth;
      props.height = nodeHeight;
    });
  }, [nodeWidth, nodeHeight, actions]);

  const handleRemove = () => {
    editorActions.delete(id);
  };

  return (
    <ResizableElement>
      <div 
        className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
        style={{
          width: "100%",
          height: "100%"
        }}
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
        
        <iframe
          src={src}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          className={`rounded-md ${selected ? "pointer-events-auto" : "pointer-events-none"}`}
          style={{
            minWidth: "100%",
            minHeight: "100%",
            display: "block"
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
    alt: "",
    x: 0,
    y: 0,
    width: 200,
    height: 300,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};