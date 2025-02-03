import { ContextMenuItem } from "@/components/ui/context-menu"
import { Image, Video, Link, Code } from "lucide-react"

export function MediaAndAdvanced() {
  return (
    <>
      <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
        <Image className="w-4 h-4 mr-2 text-[#8E8E93]" />
        <span>Insert Image</span>
        <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧I</span>
      </ContextMenuItem>
      <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
        <Video className="w-4 h-4 mr-2 text-[#8E8E93]" />
        <span>Insert Video</span>
        <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧V</span>
      </ContextMenuItem>
      <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
        <Link className="w-4 h-4 mr-2 text-[#8E8E93]" />
        <span>Link</span>
        <span className="ml-auto text-xs text-[#8E8E93]">⌘K</span>
      </ContextMenuItem>
      <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
        <Code className="w-4 h-4 mr-2 text-[#8E8E93]" />
        <span>Code Block</span>
        <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧C</span>
      </ContextMenuItem>
    </>
  )
}

