"use client"

import { Button } from "@/components/ui/button"
import { LayoutTemplateIcon as Templates, User } from "lucide-react"

export function Header() {
  return (
    <header className="border-b px-4 h-14 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" className="space-x-2">
          <Templates className="h-5 w-5" />
          <span>Templates</span>
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <Button className="bg-blue-500 hover:bg-blue-600">Publish</Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

