import {
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
  } from "@/components/ui/context-menu"
  import { Bold, Italic, Underline, Palette } from "lucide-react"
  
  export function CoreTextFormatting() {
    return (
      <>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <Bold className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Bold</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘B</span>
        </ContextMenuItem>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <Italic className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Italic</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘I</span>
        </ContextMenuItem>
        <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
          <Underline className="w-4 h-4 mr-2 text-[#8E8E93]" />
          <span>Underline</span>
          <span className="ml-auto text-xs text-[#8E8E93]">⌘U</span>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
            <Palette className="w-4 h-4 mr-2 text-[#8E8E93]" />
            <span>Text Color</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 bg-white bg-opacity-90 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
            {/* Add color options here */}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
            <Palette className="w-4 h-4 mr-2 text-[#8E8E93]" />
            <span>Highlight</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 bg-white bg-opacity-90 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
            {/* Add highlight color options here */}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </>
    )
  }
  
  