"use client";

import { useRef, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { useHistoryStore } from "@/lib/history-store";
import { ResizableElement } from "@/components/Resizer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/TextSettings";

export function TextComponent({
  content,
  x = 0,
  y = 0,
  width = "auto",
  height = "auto",
  alignment = "left",
  fontSize = "16px",
}: {
  content: string;
  x?: number;
  y?: number;
  width?: string;
  height?: string;
  alignment?: "left" | "center" | "right" | "justify";
  fontSize?: string;
}) {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { actions: editorActions } = useEditor();
  const [value, setValue] = useState(content);
  const { pushState } = useHistoryStore();
  const editableRef = useRef<HTMLDivElement>(null);

  // Update state from the contentEditable element
  const refreshContent = () => {
    if (editableRef.current) {
      const newContent = editableRef.current.innerHTML;
      setValue(newContent);
      setProp((props: any) => (props.content = newContent));
      pushState(id, newContent);
    }
  };

  const handleChange = (newContent: string) => {
    setValue(newContent);
    setProp((props: any) => (props.content = newContent));
    pushState(id, newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    setTimeout(refreshContent, 0);
  };

  const handleRemove = () => {
    editorActions.delete(id);
  };

  return (
    <ResizableElement>
      <div
        ref={(ref) => {
          connect(drag(ref!));
        }}
        className={selected ? "outline outline-2 outline-blue-500 relative" : "relative"}
        style={{
          width: "100%",
          height: "100%",
          textAlign: alignment,
          fontSize: fontSize,
        }}
      >
        {selected ? (
          <>
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                handleChange((e.target as HTMLElement).innerHTML)
              }
              onKeyDown={handleKeyDown}
              className="w-full h-full p-2 border rounded-md"
              dangerouslySetInnerHTML={{ __html: value }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: value }} />
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
    width: 200,
    height: 100,
    alignment: "left",
    fontSize: "16px",
  },
  related: {
    settings: TextSettings,
  },
};
