// components/canvas.tsx
"use client"

import React from "react"
import { useNode } from "@craftjs/core"

interface CanvasComponent extends React.FC<{ children?: React.ReactNode; gap?: number; padding?: number }> {
  craft: {
    props: {
        // Add props if you want to control canvas appearance via settings
        // e.g., backgroundColor: string; padding: number;
        gap: number; // Add gap prop for spacing between elements
    };
    displayName: string; // Ensure displayName is part of craft type if needed
    rules: {
      canMoveIn: () => boolean;
    };
  };
}

// Default props for the canvas itself
const defaultCanvasProps = {
    gap: 8, // Default gap in pixels (adjust as needed, corresponds to tailwind gap-2)
    padding: 16, // Default padding in pixels (adjust as needed, corresponds to tailwind p-4)
    // backgroundColor: '#ffffff', // Example default background
};


export const renderCanvas: CanvasComponent = ({ children, gap = defaultCanvasProps.gap, padding = defaultCanvasProps.padding }) => {
  const {
    connectors: { connect /*Removed drag connector from canvas itself*/ }, // Usually, you don't drag the canvas root itself
    hasChildren // Check if there are child nodes
  } = useNode((node) => ({
      hasChildren: node.data.nodes && node.data.nodes.length > 0,
      // You could access props here if needed:
      // gap: node.data.props.gap,
      // padding: node.data.props.padding,
  }));

  // Determine dynamic Tailwind classes for gap and padding
  // Note: Tailwind JIT needs to see full class names.
  // If gap/padding values are very dynamic, inline styles might be better.
  // For common values, we can map them.
  const paddingClass = `p-${Math.round(padding / 4)}`; // Approximation: p-4 for 16px
  const gapClass = `gap-${Math.round(gap / 4)}`;       // Approximation: gap-2 for 8px

  return (
    // Outer container: Takes available space, allows scrolling IF NEEDED by parent
    // Removed flex-1 here, let parent handle distribution
    // Added min-height to ensure drop target visibility when empty
    <div
      ref={(ref) => { if (ref) connect(ref); }} // Use a callback ref to handle the connect function
      // Let the parent handle overall scrolling: className="w-full overflow-x-hidden"
      // Use min-height for better empty state visibility
      className="relative w-full min-h-[200px] h-svh overflow-x-hidden"
    >
      {/* Inner container: Stacks elements, grows with content, applies padding/gap */}
      <div
        // Use flexbox for stacking, remove fixed heights, add padding/gap from props
        className={`relative mx-2 items-center my-8 max-w-full flex flex-col ${gapClass} rounded-lg bg-white shadow-md items-center`}
        style={{
          padding: `${padding}px`, // Use inline style for precise padding
          // Add a minimum height for visual structure, esp. when empty
          minHeight: '100px',
          // Height will be determined by content
          height: 'auto',
        }}
      >
        {children}
        {!hasChildren && (
          <div className="absolute inset-0 flex justify-center pointer-events-none border-2 border-dashed border-gray-400 rounded-lg">
            <p className="text-sm text-center text-muted-foreground p-4">
              Drag and drop elements here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

renderCanvas.displayName = "renderCanvas";

renderCanvas.craft = {
  // Define default props for the Canvas node itself
  props: defaultCanvasProps,
  displayName: "Canvas", // Name shown in Layers panel
  // No custom settings component needed for this example yet
  // related: { settings: CanvasSettings },
  rules: {
    canMoveIn: () => true, // Can drop elements into the canvas
    // You typically wouldn't drag the main canvas itself
    // canDrag: () => false,
  },
};