"use client";

import { useRef, useState, useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ResizableElement } from "@/components/Resizer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/TextSettings"; // Assume this exists

export interface TextProps {
  content: string;
  // These are props used by ResizableElement and saved by Craft
  x?: number;
  y?: number;
  width?: string | number; // Allow string for % or 'auto', or number for px
  height?: string | number; // Allow string for % or 'auto', or number for px
  alignment?: "left" | "center" | "right" | "justify";
  fontSize?: string; // Keep as string for units like '16px' or '1rem'
}

interface CraftableComponent extends React.FC<TextProps> {
  craft?: {
    displayName: string;
    props: Partial<TextProps>;
    related?: {
      settings: React.ComponentType<any>;
    };
  };
}

export const TextComponent: CraftableComponent = ({
  content,
  // x, y, width, height are handled by ResizableElement via useNode props
  alignment = "left",
  fontSize = "16px",
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { actions: editorActions } = useEditor();
  // const { pushState } = useHistoryStore(); // If you use a specific history store
  const textRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Keep local content state, synced with prop when not editing
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    // Sync local state with prop only when not editing
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);
  
  const handleRemove = () => {
    editorActions.delete(id);
  };

  return (
    <ResizableElement>
      {/* Use w-full h-full inside ResizableElement to fill its bounds */}
      <div
        ref={(ref) => {
          connect(drag(ref!));
        }}
        className={`relative w-full h-full ${selected ? "outline outline-2 outline-blue-500" : ""}`}
        style={{ textAlign: alignment, fontSize: fontSize }}
      >
        {selected ? (
          <>
            {/* ContentEditable div for editing */}
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setIsEditing(true)}
              onBlur={() => {
                setIsEditing(false);
                if (textRef.current) {
                  const newContent = textRef.current.innerHTML;
                  setProp((props: any) => (props.content = newContent));
                  // pushState(id, newContent); // If using history store
                }
              }}
              onInput={(e) => {
                const newContent = (e.target as HTMLElement).innerHTML;
                // Update local state immediately for smooth editing
                setLocalContent(newContent);
              }}
              // Make sure it fills the parent container
              className="w-full h-full p-2 border rounded-md"
              dangerouslySetInnerHTML={{ __html: localContent }} // Render HTML from prop/local state
            />
            {/* Delete Button */}
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-20" onClick={handleRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          // Render non-editable version when not selected
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </ResizableElement>
  );
}

TextComponent.craft = {
  displayName: "Text",
  props: {
    content: "Hello World",
    x: 0,
    y: 0,
    width: 200, // Default size for editor
    height: 100,
    alignment: "left",
    fontSize: "16px",
  },
  related: {
    settings: TextSettings, // Assuming TextSettings component exists
  },
};