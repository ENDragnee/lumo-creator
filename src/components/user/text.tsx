"use client";

import { useEffect, useRef, useState } from "react";
import { useNode, useEditor } from "@craftjs/core"; // added useEditor
import { ResizeHandle } from "@/components/resize-handle";
import dynamic from "next/dynamic";
import { useHistoryStore } from "@/lib/history-store";
import { ResizableElement } from "@/components/Resizer";
import { Button } from "@/components/ui/button"; // import Button
import { Trash2 } from "lucide-react"; // import Trash2 icon


const QuillWrapper = dynamic(
  () => import("@/components/user/quill-wrapper").then((mod) => mod.QuillWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="h-[150px] border rounded-md p-2">Loading editor...</div>
    ),
  }
);

export function TextComponent({ content }: { content: string }) {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Use useEditor to get access to global actions, such as delete.
  const { actions: editorActions } = useEditor();

  const [value, setValue] = useState(content);
  const quillRef = useRef<any>(null);
  const { pushState } = useHistoryStore();

  const handleChange = (content: string) => {
    setValue(content);
    setProp((props: any) => (props.content = content));
    pushState(id, content);
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
        className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
        style={{ width: "100%", height: "100%" }}  // Ensures the inner container fills the resizable
      >
        {selected ? (
          <>
            <QuillWrapper
              value={value}
              onChange={handleChange}
              ref={quillRef}
              nodeId={id}
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
          <div className="ql-editor" dangerouslySetInnerHTML={{ __html: value }} />
        )}
        {selected && <ResizeHandle />}
      </div>
    </ResizableElement>
  );
}

TextComponent.craft = {
  displayName: "Text",
  props: {
    content: "Hello World",
  },
};
