"use client";

import React from "react";
import { useNode } from "@craftjs/core";

// Define props for your main canvas area. You could add things like background color, etc.
interface RenderCanvasProps {
  children?: React.ReactNode;
  background?: string;
  padding?: number;
}

export const RenderCanvas: React.FC<RenderCanvasProps> = ({ children, background, padding = 20 }) => {
  // The useNode hook provides connectors to make this div a Craft.js node.
  const { connectors: { connect, drag } } = useNode();

  // This type-safe ref callback connects the DOM element to Craft.js,
  // making it a valid drop target.
  const handleRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      connect(drag(ref)); // Apply both 'connect' (for dropping) and 'drag' (for moving the container itself)
    }
  };

  return (
    <div
      ref={handleRef}
      className="w-full transition"
      style={{
        background: background || 'transparent',
        padding: `${padding}px`,
        // A min-height is crucial to ensure there's always a drop target, even when empty.
        minHeight: '80vh' 
      }}
    >
      {/* This is where the components you drop onto the canvas will be rendered */}
      {children}
    </div>
  );
};
