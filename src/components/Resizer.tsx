// ResizableElement.tsx
import React from "react";
import { Rnd } from "react-rnd";
import { useNode } from "@craftjs/core";
// Remove the import for useCursorMode as it's no longer needed here
// import { useCursorMode } from "@/contexts/CursorModeContext";

interface ResizableElementProps {
  width?: number;
  height?: number;
  children: React.ReactNode;
}

export const ResizableElement: React.FC<ResizableElementProps> = ({
  width = 200,
  height = 200,
  children,
}) => {
  // Remove the useCursorMode hook call
  // const { cursorMode } = useCursorMode();

  const {
    connectors: { connect, drag },
    actions,
    width: nodeWidth,
    height: nodeHeight,
    x: nodeX,
    y: nodeY,
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
    x: node.data.props.x ?? 50,
    y: node.data.props.y ?? 50,
  }));

  // Determine if the node is selected (Craft.js usually adds indicators/makes it interactive)
  // We will rely on Craft.js's selection state to determine if interactions should happen,
  // rather than the global cursorMode.

  return (
    <Rnd
      size={{ width: nodeWidth || width, height: nodeHeight || height }}
      position={{ x: nodeX, y: nodeY }}
      onResizeStop={(e, direction, ref, delta, position) => {
        actions.setProp((props: any) => {
          props.width = ref.offsetWidth;
          props.height = ref.offsetHeight;
          // Update position as well, as resizing from top/left changes position
          props.x = position.x;
          props.y = position.y;
        });
      }}
      onDragStop={(e, d) => {
        actions.setProp((props: any) => {
          props.x = d.x;
          props.y = d.y;
        });
      }}
      // Always enable resizing handles for the Rnd component.
      // Craft.js selection state will typically control visibility/interactivity.
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      // Always enable dragging for the Rnd component.
      // Craft.js manages when dragging is actually possible (usually when selected).
      disableDragging={false}
      bounds="parent"
      innerRef={(ref: HTMLDivElement | null) => {
        if (ref) {
          // Connect both connect (for selection/overlay) and drag
          connect(drag(ref));
        }
      }}
      style={{
        // Add a subtle indicator when selected (Craft.js might do this already)
        // Consider adding this style conditionally based on useNode's 'selected' state if needed.
        border: "1px dashed #ddd", // Keep the visual border
        background: "transparent",
        overflow: "visible", // Allow handles to be visible
      }}
      // Add classes for styling handles if needed, e.g., based on selection
      // className={selected ? 'is-selected' : ''}
    >
      {/* Add wrapper div with full size */}
      <div style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}>
        {children}
      </div>
    </Rnd>
  );
};