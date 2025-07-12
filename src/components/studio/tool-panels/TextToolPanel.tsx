"use client";

import { useEditor } from "@craftjs/core";
import { TextComponent } from "@/components/editor-components/TextComponent";
import { Type } from "lucide-react";

const textPresets = [
  {
    name: "Title",
    props: {
      text: "Title Text",
      fontSize: "36",
      fontWeight: "bold",
      tagName: "h1",
    },
    style: { fontSize: '24px', fontWeight: 'bold' }
  },
  {
    name: "Subtitle",
    props: {
      text: "Subtitle or heading",
      fontSize: "24",
      fontWeight: "600",
      tagName: "h2",
    },
    style: { fontSize: '18px', fontWeight: '600', color: '#666' }
  },
  {
    name: "Body Paragraph",
    props: {
      text: "This is a standard paragraph.",
      fontSize: "16",
      fontWeight: "normal",
      tagName: "p",
    },
     style: { fontSize: '14px', fontWeight: 'normal' }
  },
];

export function TextToolPanel() {
  const { connectors } = useEditor();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-shrink-0 border-b">
        <h2 className="text-lg font-semibold">Text Blocks</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        <p className="text-sm text-muted-foreground mb-4">Drag a text block onto the canvas.</p>
        {textPresets.map((preset) => (
          <div
            key={preset.name}
            ref={(ref) => ref && connectors.create(ref, <TextComponent {...preset.props} />)}
            className="cursor-grab p-4 border rounded-lg bg-card hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold">{preset.name}</h3>
                <p className="text-xs text-muted-foreground truncate" style={preset.style}>
                    {preset.props.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
