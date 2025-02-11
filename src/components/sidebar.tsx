"use client"

import React from "react"
import { useEditor } from "@craftjs/core"

export function Sidebar() {
  const { selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").last()
    let selected
    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
      }
    }

    return {
      selected,
    }
  })

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
      {selected ? (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">{selected.name} Settings</h2>
          {selected.settings && React.createElement(selected.settings)}
        </div>
      ) : (
        <div className="p-4 text-gray-500">Select a component to edit its properties</div>
      )}
    </div>
  )
}
