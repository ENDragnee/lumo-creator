"use client"

import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Smartphone, Tablet, Monitor } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useEditorStore } from "@/lib/editor-store"
import { ContentModal } from "@/components/ContentModal"
import { useSearchParams } from "next/navigation"

export function Navbar() {
  const { actions, canUndo, canRedo, query } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))
  const { enabled, setEnabled } = useEditorStore()
  const searchParams = useSearchParams()
  const contentId = searchParams.get("contentId")

  const saveContent = async (modalData: {
    title: string
    thumbnail: string
    tags: string[]
    institution?: string
    subject?: string
  }) => {
    try {
      const editorData = query.serialize()
      const payload = { 
        ...modalData, 
        data: JSON.stringify(editorData) 
      }
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to publish")
      const result = await response.json()
      console.log("Published successfully:", result)
    } catch (e) {
      console.error("Publish error:", e)
    }
  }

  const handleUndo = () => {
    if (actions?.history?.undo) {
      actions.history.undo()
    }
  }

  const handleRedo = () => {
    if (actions?.history?.redo) {
      actions.history.redo()
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2">
        {/* Show ContentModal only if no contentId (new content) */}
        {!contentId && <ContentModal onSave={saveContent} />}
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