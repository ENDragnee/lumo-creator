"use client"

import { useNode } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"

export function QuizComponent() {
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
      <h3 className="text-lg font-semibold">Quiz Component</h3>
      <p className="text-sm text-gray-500">Sample question:</p>
      <p className="mt-2">What is the capital of France?</p>
      {selected && <ResizeHandle />}
    </div>
  )
}

QuizComponent.craft = {
  displayName: "Quiz",
}

