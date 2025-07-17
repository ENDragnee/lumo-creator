"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node as CraftNode } from "@craftjs/core";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "./settings/TextSettings";
import "katex/dist/katex.min.css";

// --- TextProps Interface ---
export interface TextProps {
  text: string;
  width?: string | number;
  alignment?: "left" | "center" | "right" | "justify";
  fontSize?: string;
  color?: string;
  backgroundColor?: string; // <-- ADDED: Background color prop
  fontWeight?: string;
  padding?: string | number;
  tagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
}

// --- CraftableComponent Interface ---
interface CraftableComponent extends React.FC<TextProps> {
  craft?: {
    displayName: string;
    props: Partial<TextProps>;
    related?: {
      settings: React.ComponentType<any>;
    };
    rules?: {
      canDrag?: (node: CraftNode) => boolean;
    };
  };
}

// --- Helper function to adjust textarea height ---
const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
};

export const TextComponent: CraftableComponent = ({
  text = "Edit me!",
  alignment = "left",
  fontSize = "16px",
  color = "inherit",
  backgroundColor = "transparent", // <-- ADDED: Background color default
  fontWeight = "normal",
  width = "100%",
  padding = "8px",
  tagName = "p",
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { actions: editorActions, enabled: editorEnabled } = useEditor(
    (state) => ({
      enabled: state.options.enabled,
    })
  );

  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalContent(text);
    }
  }, [text, isEditing]);

  const handleBeginEditing = useCallback(() => {
    if (!editorEnabled) return;
    setLocalContent(text);
    setIsEditing(true);
  }, [editorEnabled, text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
      requestAnimationFrame(() => adjustTextareaHeight(textareaRef.current));
    }
  }, [isEditing]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    adjustTextareaHeight(textareaRef.current);
  };

  const handleFinishEditing = useCallback(() => {
    if (!isEditing) return;
    setIsEditing(false);
    if (localContent.trim() !== text.trim()) {
      setProp((props: TextProps) => {
        props.text = localContent;
      }, 500);
    }
  }, [setProp, localContent, text, isEditing]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      editorActions.delete(id);
    },
    [editorActions, id]
  );

  const rootStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    position: "relative",
    textAlign: alignment,
    fontSize: fontSize,
    color: color === "inherit" ? undefined : color,
    backgroundColor: backgroundColor, // <-- ADDED: Apply background color
    fontWeight: fontWeight,
    padding: typeof padding === "number" ? `${padding}px` : padding,
    outline: selected && editorEnabled ? "2px dashed #3B82F6" : "none",
    outlineOffset: "2px",
    transition: "outline 0.1s ease-in-out",
    lineHeight: 1.5,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    resize: "none",
    border: "none",
    outline: "1px solid #ddd",
    background: "rgba(240, 240, 240, 0.5)",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: "inherit",
    fontWeight: "inherit",
    textAlign: "inherit",
    padding: 0,
    margin: 0,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    overflowY: "hidden",
    lineHeight: "inherit",
    boxSizing: "border-box",
  };

  const contentDisplayStyle: React.CSSProperties = {
    width: "100%",
    overflowWrap: "break-word",
  };

  const CustomTag = tagName;

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      style={rootStyle}
      className={`relative ${
        editorEnabled ? "cursor-grab" : ""
      } text-component-wrapper`}
      onClick={selected && editorEnabled ? handleBeginEditing : undefined}
      title={editorEnabled ? "Drag to reorder, double-click to edit" : ""}
      onDoubleClick={(e) => {
        if (isEditing) e.stopPropagation();
        if (editorEnabled && !selected) editorActions.selectNode(id);
      }}
      onBlurCapture={(e) => {
        if (
          isEditing &&
          !e.currentTarget.contains(e.relatedTarget as Node | null)
        ) {
          handleFinishEditing();
        }
      }}
    >
      {isEditing && editorEnabled ? (
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleTextareaChange}
          style={textareaStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          rows={1}
        />
      ) : (
        <div
          style={contentDisplayStyle}
          className="craft-markdown-display prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
        >
          <ReactMarkdown
            components={{ p: CustomTag, h1: CustomTag, h2: CustomTag, h3: CustomTag }}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeSanitize, [rehypeKatex, { output: "mathml" }]]}
          >
            {text || ""}
          </ReactMarkdown>
        </div>
      )}

      {selected && editorEnabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-0 right-0 z-10 -mt-3 -mr-3 h-6 w-6 opacity-80 hover:opacity-100"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={handleRemove}
          aria-label="Delete Text Element"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

TextComponent.craft = {
  displayName: "Text",
  props: {
    text: "This is a new text block.",
    tagName: "p",
    fontSize: "16px",
    alignment: "left",
    color: "#333333",
    backgroundColor: "transparent", // <-- ADDED: Default background color
    fontWeight: "normal",
  } satisfies Partial<TextProps>,
  related: {
    settings: TextSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
