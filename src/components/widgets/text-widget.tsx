"use client";
import { useState, useRef, useCallback } from "react";
import { useNode } from "@craftjs/core";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/ui/icons";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";

interface TextWidgetProps {
  content: string;
}

export function TextWidget({ content: initialContent }: TextWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // CraftJS integration
  const { connectors: { connect, drag }, actions: { setProp }, selected } = useNode((node) => ({
    selected: node.events.selected,
    content: node.data.props.content
  }));

  const handleFormatText = useCallback((format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // ... (keep existing format handling logic)
    const newContent = formatText(selectedText, format); // Define newContent based on your formatting logic

    setProp((props: TextWidgetProps) => {
      props.content = newContent;
    });
    
    textarea.focus();
    textarea.setSelectionRange(start + newContent.length, start + newContent.length);
  }, [setProp]);

  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} className={`relative min-w-[200px] min-h-[100px] ${selected ? "border-2 border-ios-blue" : ""}`}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="h-full">
            {isEditing ? (
              <Textarea
                ref={textareaRef}
                value={initialContent}
                onChange={(e) => setProp((props: TextWidgetProps) => {
                  props.content = e.target.value;
                })}
                className="w-full h-full min-h-[100px] p-2 text-sm font-sans"
                autoFocus
              />
            ) : (
              <div className="prose prose-sm h-full p-2">
                <ReactMarkdown>{initialContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        
        {/* Keep existing context menu structure */}
        <ContextMenuContent className="w-64">
          {/* ... existing menu items ... */}
        </ContextMenuContent>
      </ContextMenu>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => setIsEditing(!isEditing)}
      >
        <Icons.edit className="h-4 w-4" />
      </Button>
    </div>
  );
}

// CraftJS wrapper component
export const CraftTextWidget = ({ content }: TextWidgetProps) => {
  return (
    <TextWidget content={content} />
  );
};

// CraftJS configuration for the component
CraftTextWidget.craft = {
  displayName: "Text Widget",
  props: {
    content: "Default text content"
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};
function formatText(selectedText: string, format: string) {
  switch (format) {
    case "bold":
      return `**${selectedText}**`;
    case "italic":
      return `*${selectedText}*`;
    case "underline":
      return `<u>${selectedText}</u>`;
    case "strikethrough":
      return `~~${selectedText}~~`;
    default:
      return selectedText;
  }
}
