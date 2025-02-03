"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarCategory } from "./sidebar-category"
import { basicWidgets, interactiveWidgets, advancedWidgets } from "@/lib/widgets"

export function Sidebar() {
  return (
    <div className="w-60 border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search widgets.." className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-8">
          <SidebarCategory title="BASICS" items={basicWidgets} />
          <SidebarCategory title="INTERACTIVE" items={interactiveWidgets} />
          <SidebarCategory title="ADVANCED" items={advancedWidgets} />
        </div>
      </ScrollArea>
    </div>
  )
}

