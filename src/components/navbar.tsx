"use client"

import { useState } from "react" // Import useState
import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Smartphone, Tablet, Monitor, Loader2 } from "lucide-react" // Import Loader2 for spinner
import { Separator } from "@/components/ui/separator"
import { useEditorStore } from "@/lib/editor-store"
import { ContentModal } from "@/components/Modals/ContentModal"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

export function Navbar() {
  const { actions, canUndo, canRedo, query } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))
  const { enabled, setEnabled } = useEditorStore()
  const searchParams = useSearchParams()
  const contentId = searchParams.get("contentId")
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false) // Add state for loading indicator

  // Publish content if there's no contentId (new content)
  // Note: You might want a loading state here too, similar to manualSave
  const saveContent = async (modalData: {
    title: string
    thumbnail: string
    tags: string[]
    institution?: string
    subject?: string
  }) => {
    // Consider adding setIsSaving(true) here and setIsSaving(false) in finally
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
      // Potentially redirect or update UI after successful publish
    } catch (e) {
      console.error("Publish error:", e)
      // Handle publish error (e.g., show a notification)
    } finally {
      // setIsSaving(false) // If you add loading state to publish
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

  // Manual save function that sends a PUT request if contentId exists
  const manualSave = async () => {
    if (!contentId) {
      console.warn("No contentId provided, cannot save manually.")
      return // Exit early if no contentId
    }
    if (isSaving) {
        return // Prevent multiple saves if already saving
    }

    setIsSaving(true) // Start loading indicator
    const editorData = query.serialize()

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, data: JSON.stringify(editorData) }),
      })
      if (!response.ok) {
        console.error("Failed to update content")
        // Handle save error (e.g., show a notification)
      } else {
        console.log("Content updated successfully")
        // Optional: Show success notification
      }
    } catch (error) {
      console.error("Error updating content:", error)
      // Handle network or other errors (e.g., show a notification)
    } finally {
      setIsSaving(false) // Stop loading indicator regardless of success/failure
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 bg-gray-100 rounded-b-3xl mb-1 bg-background px-6">
      <div className="flex items-center gap-2">
        {/* Show ContentModal only if no contentId (new content) */}
        {!contentId && (
          <ContentModal
            onSave={saveContent}
            open={true} // Consider managing modal open state differently if needed
            onOpenChange={(isOpen) => console.log("Modal open state:", isOpen)}
            userId={session?.user?.name ?? "Guest"}
          />
        )}
        <div className="bg-gray-200 rounded-xl flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo} className="hover:bg-gray-400">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo} className="hover:bg-gray-400">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Add the manual Save button with loading state */}
        {/* Show save button only if contentId exists */}
        {contentId && (
          <Button
            variant="ghost"
            onClick={manualSave}
            className="hover:bg-gray-300 bg-gray-200 min-w-[80px]" // Added min-width to prevent layout shift
            disabled={isSaving} // Disable button while saving
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {/* Loading icon */}
                Saving
              </>
            ) : (
              "Save" // Default text
            )}
          </Button>
        )}
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-2">
        {/* Placeholder for potential future elements */}
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