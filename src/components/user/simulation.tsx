import React from "react";
import { ResizableElement } from "@/components/Resizer";
import { useNode, useEditor } from "@craftjs/core";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulationProps {
  src: string;
}

export const SimulationComponent = ({ src }: SimulationProps) => {
  const {
    connectors: { connect, drag },
    selected,
    id, // Get the node's id
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
  }));

  // Use editor actions for deletion functionality
  const { actions } = useEditor();

  const handleRemove = () => {
    actions.delete(id);
  };

  return (
    <ResizableElement>
      <div className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}>
        {/* Transparent overlay for drag handling */}
        <div
          ref={(ref) => {
            if (ref) {
              connect(drag(ref));
            }
          }}
          className="absolute inset-0 z-10 cursor-move"
          style={{ background: "transparent" }}
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
          height="300"
          frameBorder="0"
          allowFullScreen
          className={`rounded-md ${selected ? "pointer-events-auto" : "pointer-events-none"}`}
        ></iframe>
      </div>
    </ResizableElement>
  );
};

SimulationComponent.craft = {
  displayName: "Simulation",
  props: {
    src: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
