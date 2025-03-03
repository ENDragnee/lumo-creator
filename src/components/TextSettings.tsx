"use client";

import { useNode } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function TextSettings() {
  const {
    actions: { setProp },
    alignment,
    content,
    fontSize,
  } = useNode((node) => ({
    alignment: node.data.props.alignment,
    content: node.data.props.content,
    fontSize: node.data.props.fontSize,
  }));

  // Local state for header dropdown; "p" is normal text.
  const [header, setHeader] = useState("p");

  // Helper to run execCommand and then refresh the content from the active element.
  const applyCommand = (command: string, value?: any) => {
    document.execCommand(command, false, value);
    const activeEl = document.activeElement;
    if (activeEl && activeEl instanceof HTMLElement && activeEl.isContentEditable) {
      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleLink = () => {
    const url = prompt("Enter the URL");
    if (url) {
      let newUrl = url.trim();
      if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
        newUrl = "https://" + newUrl;
      }
      applyCommand("createLink", newUrl);
    }
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setHeader(value);
    applyCommand("formatBlock", value);
  };

  return (
    <div className="bg-white shadow rounded p-4 space-y-4">
      {/* Alignment control */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1 text-gray-700">Alignment</label>
        <select
          value={alignment}
          onChange={(e) =>
            setProp((props: any) => (props.alignment = e.target.value))
          }
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>

      {/* Font Size Slider */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1 text-gray-700">Font Size</label>
        <input
          type="range"
          min="8"
          max="72"
          step="1"
          value={parseInt(fontSize)}
          onChange={(e) =>
            setProp((props: any) => (props.fontSize = e.target.value + "px"))
          }
          className="w-full"
        />
        <span className="text-xs text-gray-500">{fontSize}</span>
      </div>

      {/* Formatting toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => applyCommand("bold")}>Bold</Button>
        <Button onClick={() => applyCommand("italic")}>Italic</Button>
        <Button onClick={() => applyCommand("underline")}>Underline</Button>
        <Button onClick={() => applyCommand("strikeThrough")}>Strike</Button>
        <select
          value={header}
          onChange={handleHeaderChange}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="p">Normal</option>
          <option value="h1">Header 1</option>
          <option value="h2">Header 2</option>
          <option value="h3">Header 3</option>
        </select>
        <Button onClick={() => applyCommand("insertOrderedList")}>
          Ordered List
        </Button>
        <Button onClick={() => applyCommand("insertUnorderedList")}>
          Bullet List
        </Button>
        <Input
          type="color"
          onChange={(e) => applyCommand("foreColor", e.target.value)}
          title="Text Color"
          className="w-10 p-0 border border-gray-300 rounded"
        />
        <Input
          type="color"
          onChange={(e) => applyCommand("hiliteColor", e.target.value)}
          title="Background Color"
          className="w-10 p-0 border border-gray-300 rounded"
        />
        <Button onClick={handleLink}>Link</Button>
        <Button onClick={() => applyCommand("undo")}>Undo</Button>
        <Button onClick={() => applyCommand("redo")}>Redo</Button>
      </div>

      {/* Direct content editing */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1 text-gray-700">Content</label>
        <textarea
          value={content}
          onChange={(e) =>
            setProp((props: any) => (props.content = e.target.value))
          }
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
          rows={4}
        />
      </div>
    </div>
  );
}
