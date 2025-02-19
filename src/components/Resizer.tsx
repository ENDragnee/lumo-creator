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
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
  }));

  return (
    <Rnd
      size={{ width: nodeWidth || width, height: nodeHeight || height }}
      default={{
        x: 50,
        y: 50,
        width: nodeWidth || width,
        height: nodeHeight || height,
      }}
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
      style={{ border: "1px dashed #ddd", padding: "8px", background: "#fff" }}
    >
      {children}
    </Rnd>
  );
};
