// components/user/FooterComponent.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node as CraftNode } from "@craftjs/core";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/settings/TextSettings"; // Re-use TextSettings for now

// --- TextProps Interface --- (Keep same props as TextComponent)
export interface FooterProps {
    content: string;
    width?: string | number;
    alignment?: "left" | "center" | "right" | "justify";
    fontSize?: string;
    color?: string;
    fontWeight?: string;
    padding?: string | number;
}

// --- CraftableComponent Interface ---
interface CraftableComponent extends React.FC<FooterProps> {
    craft?: {
      displayName: string;
      props: Partial<FooterProps>;
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
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
};

export const FooterComponent: CraftableComponent = ({
  content = "_Footer Text_", // Default content for Footer (Markdown italic)
  alignment = "center",      // Default alignment for Footer
  fontSize = "12px",         // Default font size for Footer
  color = "#666666",         // Default color for Footer
  fontWeight = "normal",
  width = "100%",
  padding = "4px 8px",       // Default padding for Footer
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { actions: editorActions, enabled: editorEnabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // --- State Syncing ---
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);

  // --- Handle Entering Edit Mode ---
  const handleBeginEditing = useCallback(() => {
    if (!editorEnabled) return;
    setLocalContent(content);
    setIsEditing(true);
  }, [editorEnabled, content]);

  // --- Handle Focus and Initial Height ---
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
      requestAnimationFrame(() => {
           adjustTextareaHeight(textareaRef.current);
      });
    }
  }, [isEditing]);

  // --- Handle Textarea Changes ---
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    adjustTextareaHeight(textareaRef.current);
  };

  // --- Handle Finishing Editing ---
  const handleFinishEditing = useCallback(() => {
    if (!isEditing) return;
    setIsEditing(false);
    const trimmedContent = localContent.trim();
    if (trimmedContent !== content.trim()) {
      setProp((props: FooterProps) => { props.content = trimmedContent; }, 100);
    }
  }, [setProp, localContent, content, isEditing]);

  // --- Handle Element Removal ---
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editorActions.delete(id);
  }, [editorActions, id]);

  // --- Styles ---
   const rootStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        position: 'relative',
        textAlign: alignment,
        fontSize: fontSize,
        color: color,
        fontWeight: fontWeight,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        outline: selected && editorEnabled ? '2px dashed blue' : 'none',
        outlineOffset: '2px',
        transition: 'outline 0.1s ease-in-out',
        minHeight: `calc(${fontSize || '12px'} * 1.2)`, // Use default fontSize
        lineHeight: 1.5,
   };

   const textareaStyle: React.CSSProperties = {
        width: '100%',
        height: 'auto',
        minHeight: `calc(${fontSize || '12px'} * 1.2)`,
        resize: 'none',
        border: 'none',
        outline: 'none',
        background: 'rgba(240, 240, 240, 0.5)',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        color: 'inherit',
        fontWeight: 'inherit',
        textAlign: alignment,
        padding: 0,
        margin: 0,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        overflowY: 'hidden',
        lineHeight: 1.5, // Match container
        boxSizing: 'border-box',
   };

  const contentDisplayStyle: React.CSSProperties = {
       width: '100%',
       overflowWrap: 'break-word',
  };


  return (
    <div
        ref={(ref) => {
            if (ref) {
                connect(drag(ref));
                rootRef.current = ref;
            }
        }}
        style={rootStyle}
        className={`relative ${editorEnabled ? 'cursor-grab' : ''} transition-shadow duration-100 hover:shadow-md bg-gray-50 hover:bg-gray-100 rounded-lg`}
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Drag to reorder, double-click to edit" : ""}
        onClick={(e) => {
             if (isEditing) e.stopPropagation();
             if (editorEnabled && !selected) {
                editorActions.selectNode(id);
             }
         }}
         onBlurCapture={(e) => {
            if (isEditing && !rootRef.current?.contains(e.relatedTarget as Node | null)) {
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
            // Use smaller prose for footer
            className="craft-markdown-display prose prose-sm max-w-none"
        >
           <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
           >
              {content || ""}
           </ReactMarkdown>
        </div>
      )}

      {selected && editorEnabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-0 right-0 z-10 -mt-2 -mr-2 h-5 w-5 opacity-80 hover:opacity-100"
          onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
          }}
          onClick={handleRemove}
          aria-label="Delete Footer Element"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// --- Update Craft Config ---
FooterComponent.craft = {
  displayName: "Footer", // Changed display name
  props: {
    content: `_Footer text_`, // Default content
    width: '100%',
    alignment: "center",      // Default alignment
    fontSize: "12px",         // Default size
    color: "#666666",         // Default color
    fontWeight: "normal",
    padding: "4px 8px",       // Default padding
  } satisfies Partial<FooterProps>,
  related: {
    settings: TextSettings, // Reuse TextSettings for now
  },
  rules: {
    canDrag: () => true,
  },
};