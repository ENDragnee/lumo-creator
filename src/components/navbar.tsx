"use client"

import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Save, Smartphone, Tablet, Monitor } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useEditorStore } from "@/lib/editor-store"

export function Navbar() {
  const { actions, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))
  const { enabled, setEnabled } = useEditorStore()

  const handleUndo = () => {
    if (actions && actions.history && typeof actions.history.undo === "function") {
      actions.history.undo()
    }
  }

  const handleRedo = () => {
    if (actions && actions.history && typeof actions.history.redo === "function") {
      actions.history.redo()
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-2">
        <Button variant={enabled ? "secondary" : "ghost"} onClick={() => setEnabled(true)}>
          Edit
        </Button>
        <Button variant={!enabled ? "secondary" : "ghost"} onClick={() => setEnabled(false)}>
          Preview
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Smartphone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Tablet className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

