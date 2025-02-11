import type React from "react"
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

  return (
    <div ref={(ref) => { connect(drag(ref!)); }} className="relative flex-1 overflow-auto bg-zinc-50 p-4">
      <div className="relative m-8 min-h-[calc(100%-4rem)] rounded-lg border-2 border-dashed border-zinc-200">
        {children}
        {!children && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Drag and drop elements here</p>
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

