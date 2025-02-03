import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-6">
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
          isOpen && "ring-4 ring-blue-300",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icons.sparkles className="h-6 w-6" />
      </Button>
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <h3 className="font-medium mb-2">AI Assistant</h3>
          <p className="text-sm text-gray-600 mb-4">How can I help you today?</p>
          {/* Add chat interface here */}
        </div>
      )}
    </div>
  )
}

