//Context Menu Component
import { useState } from "react"
import {
  ContextMenu as ShadcnContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuPortal,
} from "@/components/ui/context-menu"
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatColorText,
  MdFormatColorFill,
  MdTitle,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdTableChart,
  MdFormatQuote,
  MdImage,
  MdVideoLibrary,
  MdLink,
  MdCode,
  MdFormatClear,
  MdAutoFixHigh,
  MdSpellcheck,
} from "react-icons/md"

type ContextMenuProps = {

  x: number;

  y: number;

  widgetId?: string;

  onDelete: () => void;

};

export function ContextMenu({ x, y }: ContextMenuProps) {
  const [colorSubmenu, setColorSubmenu] = useState<string | null>(null)

  return (
    <ShadcnContextMenu>
      <ContextMenuPortal>
        <ContextMenuContent
          className="w-64 rounded-xl bg-white bg-opacity-98 backdrop-blur-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{
            left: x,
            top: y,
            position: "fixed",
          }}
        >
          <div className="py-1">
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatBold className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Bold</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘B</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatItalic className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Italic</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘I</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatUnderlined className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Underline</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘U</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                <MdFormatColorText className="w-4 h-4 mr-2 text-[#8E8E93]" />
                <span>Text Color</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40 bg-white bg-opacity-98 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
                {/* Add color options here */}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                <MdFormatColorFill className="w-4 h-4 mr-2 text-[#8E8E93]" />
                <span>Highlight</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40 bg-white bg-opacity-98 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
                {/* Add highlight color options here */}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </div>
          <ContextMenuSeparator className="bg-[#E5E5EA]" />
          <div className="py-1">
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                <MdTitle className="w-4 h-4 mr-2 text-[#8E8E93]" />
                <span>Heading Style</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40 bg-white bg-opacity-98 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
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
              <MdFormatListBulleted className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Bulleted List</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧8</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatListNumbered className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Numbered List</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧7</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                <MdTableChart className="w-4 h-4 mr-2 text-[#8E8E93]" />
                <span>Table</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40 bg-white bg-opacity-98 backdrop-blur-xl shadow-lg border border-gray-200 rounded-xl">
                <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                  3x3 Table
                </ContextMenuItem>
                <ContextMenuItem className="px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
                  4x2 Table
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatQuote className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Quote Block</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧Q</span>
            </ContextMenuItem>
          </div>
          <ContextMenuSeparator className="bg-[#E5E5EA]" />
          <div className="py-1">
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdImage className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Insert Image</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧I</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdVideoLibrary className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Insert Video</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧V</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdLink className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Link</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘K</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdCode className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Code Block</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧C</span>
            </ContextMenuItem>
          </div>
          <ContextMenuSeparator className="bg-[#E5E5EA]" />
          <div className="py-1">
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdFormatClear className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Clear Format</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘\</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdAutoFixHigh className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>AI Suggestions</span>
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center px-3 py-1.5 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] rounded-lg">
              <MdSpellcheck className="w-4 h-4 mr-2 text-[#8E8E93]" />
              <span>Spell Check</span>
              <span className="ml-auto text-xs text-[#8E8E93]">⌘⇧;</span>
            </ContextMenuItem>
          </div>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ShadcnContextMenu>
  )
}

