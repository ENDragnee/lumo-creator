import {
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
  } from "@/components/ui/context-menu"
  import { Heading, List, Table, Quote } from "lucide-react"
  
  export function StructuralFormatting() {
    return (
      <>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
            <Heading className="w-4 h-4 mr-2 text-[#8E8E93]" />
            <span>Heading Style</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 bg-white bg-opacity-90 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
            <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              Heading 1
            </ContextMenuItem>
            <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              Heading 2
            </ContextMenuItem>
            <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              Heading 3
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <List className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Bulleted List</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧8</span>
        </ContextMenuItem>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <List className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Numbered List</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧7</span>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
            <Table className="w-4 h-4 mr-2 text-[#8E8E93]" />
            <span>Table</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 bg-white bg-opacity-90 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
            <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              3x3 Table
            </ContextMenuItem>
            <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              4x2 Table
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <Quote className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Quote Block</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧Q</span>
        </ContextMenuItem>
      </>
    )
  }
  
  