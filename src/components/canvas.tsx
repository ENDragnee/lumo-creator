"use client"

import React from "react"
import { useNode } from "@craftjs/core"

interface CanvasComponent extends React.FC<{ children?: React.ReactNode }> {
  craft: {
    rules: {
      canMoveIn: () => boolean;
    };
  };
}

export const Canvas: CanvasComponent = ({ children }) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  const isEmpty = React.Children.count(children) === 0

  return (
    <div
      ref={(ref) => {
        connect(drag(ref!))
      }}
      className="relative flex-1 overflow-auto p-4"
    >
      <div
        className={`relative m-8 min-h-[calc(100%-4rem)] rounded-lg ${
          isEmpty ? "border-2 border-dashed border-zinc-200" : ""
        }`}
      >
        {children}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Drag and drop elements here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

Canvas.craft = {
  rules: {
    canMoveIn: () => true,
  },
}
