import React from "react";
import { Rnd } from "react-rnd";
import { useNode } from "@craftjs/core";
import { useCursorMode } from "@/contexts/CursorModeContext";

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
  const { cursorMode } = useCursorMode();
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
    x: node.data.props.x ?? 50, // fallback default if not set
    y: node.data.props.y ?? 50,
  }));

  return (
    <Rnd
      // Use controlled props for size and position
      size={{ width: nodeWidth || width, height: nodeHeight || height }}
      position={{ x: nodeX, y: nodeY }}
      onResizeStop={(e, direction, ref, delta, position) => {
        actions.setProp((props: any) => {
          props.width = ref.offsetWidth;
          props.height = ref.offsetHeight;
        });
      }}
      onDragStop={(e, d) => {
        actions.setProp((props: any) => {
          props.x = d.x;
          props.y = d.y;
        });
      }}
      enableResizing={{
        top: cursorMode === "resize",
        right: cursorMode === "resize",
        bottom: cursorMode === "resize",
        left: cursorMode === "resize",
        topRight: cursorMode === "resize",
        bottomRight: cursorMode === "resize",
        bottomLeft: cursorMode === "resize",
        topLeft: cursorMode === "resize",
      }}
      disableDragging={cursorMode !== "drag"}
      innerRef={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      style={{ border: "1px dashed #ddd", padding: "8px", background: "#fff00" }}
    >
      {children}
    </Rnd>
  );
};
