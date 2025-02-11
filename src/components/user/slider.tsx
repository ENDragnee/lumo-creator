"use client"

import { useNode } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"

export function SliderComponent() {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  return (
    <div
      ref={(ref) => {connect(drag(ref!))}}
      className={`relative p-4 border rounded-lg ${selected ? "outline outline-2 outline-blue-500" : ""}`}
    >
      <h3 className="text-lg font-semibold">Slider Component</h3>
      <input type="range" min="0" max="100" className="w-full" />
      {selected && <ResizeHandle />}
    </div>
  )
}

SliderComponent.craft = {
  displayName: "Slider",
}

