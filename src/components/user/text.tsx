// components/user/text.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { ResizeHandle } from "@/components/resize-handle";
import dynamic from "next/dynamic";
import { useHistoryStore } from "@/lib/history-store";

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

  const [value, setValue] = useState(content);
  const quillRef = useRef<any>(null);
  const { pushState } = useHistoryStore();

  const handleChange = (content: string) => {
    setValue(content);
    setProp((props: any) => (props.content = content));
    pushState(id, content);
  };

  return (
    <div
      ref={(ref) => { connect(drag(ref!)); }}
      className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
    >
      {selected ? (
        <QuillWrapper
          value={value}
          onChange={handleChange}
          ref={quillRef}
          nodeId={id}
        />
      ) : (
        <div
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
      {selected && <ResizeHandle />}
    </div>
  );
}

TextComponent.craft = {
  displayName: "Text",
  props: {
    content: "Hello World",
  },
};