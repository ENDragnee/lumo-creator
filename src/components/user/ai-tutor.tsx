"use client"

import { useNode } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"

export function AITutorComponent() {
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
      <h3 className="text-lg font-semibold">AI Tutor</h3>
      <p className="text-sm text-gray-500">Interactive AI-powered tutoring</p>
      {selected && <ResizeHandle />}
    </div>
  )
}

AITutorComponent.craft = {
  displayName: "AI Tutor",
}

