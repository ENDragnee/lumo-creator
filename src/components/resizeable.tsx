// components/resizable.tsx
"use client";
import { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";

export const Resizable = ({ children, minWidth = 100, minHeight = 100 }: any) => {
  const { connectors: { connect, drag }, actions: { setProp }, selected, id, width, height } = useNode((node) => ({
    selected: node.events.selected,
    width: node.data.props.width || 300,
    height: node.data.props.height || 200
  }));

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<"n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw">("se");
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = (dir: typeof resizeDir) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width, height });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    const newSize = { width: startSize.width, height: startSize.height };

    switch (resizeDir) {
      case "e":
        newSize.width = Math.max(minWidth, startSize.width + deltaX);
        break;
      case "s":
        newSize.height = Math.max(minHeight, startSize.height + deltaY);
        break;
      case "se":
        newSize.width = Math.max(minWidth, startSize.width + deltaX);
        newSize.height = Math.max(minHeight, startSize.height + deltaY);
        break;
      // Add other directions as needed
    }

    setProp((props: any) => {
      props.width = newSize.width;
      props.height = newSize.height;
    });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={`relative ${selected ? "border-2 border-ios-blue" : ""}`}
    >
      {children}
      
      {selected && (
        <>
          {/* Bottom-right handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-blue-500"
            onMouseDown={handleMouseDown("se")}
          />
        </>
      )}
    </div>
  );
};