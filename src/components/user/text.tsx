// components/user/text.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node as CraftNode } from "@craftjs/core"; // Use CraftNode alias if needed, else stick to Node
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm'; // <--- Import GFM plugin
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/settings/TextSettings";

// --- TextProps Interface --- (Keep as is)
export interface TextProps {
    content: string;
    width?: string | number;
    alignment?: "left" | "center" | "right" | "justify";
    fontSize?: string;
    color?: string;
    fontWeight?: string;
    padding?: string | number;
}

// --- CraftableComponent Interface --- (Keep as is)
interface CraftableComponent extends React.FC<TextProps> {
    craft?: {
      displayName: string;
      props: Partial<TextProps>;
      related?: {
        settings: React.ComponentType<any>;
      };
      rules?: {
        canDrag?: (node: CraftNode) => boolean; // Use CraftNode if that's the intended type
      };
    };
  }

// --- Helper function to adjust textarea height --- (Keep as is)
const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
};

export const TextComponent: CraftableComponent = ({
  content = "Edit me!",
  alignment = "left",
  fontSize = "16px",
  color = "inherit",
  fontWeight = "normal",
  width = "100%",
  padding = "8px",
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

  // --- State Syncing --- (Keep as is)
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);

  // --- Handle Entering Edit Mode --- (Keep as is)
  const handleBeginEditing = useCallback(() => {
    if (!editorEnabled) return;
    setLocalContent(content);
    setIsEditing(true);
  }, [editorEnabled, content]);

  // --- Handle Focus and Initial Height --- (Keep as is)
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

  // --- Handle Textarea Changes --- (Keep as is)
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    adjustTextareaHeight(textareaRef.current);
  };

  // --- Handle Finishing Editing --- (Keep as is)
  const handleFinishEditing = useCallback(() => {
    if (!isEditing) return;
    setIsEditing(false);
    const trimmedContent = localContent.trim();
    if (trimmedContent !== content.trim()) {
      setProp((props: TextProps) => { props.content = trimmedContent; }, 100);
    }
  }, [setProp, localContent, content, isEditing]);

  // --- Handle Element Removal --- (Keep as is)
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editorActions.delete(id);
  }, [editorActions, id]);

  // --- Styles ---
  // rootStyle & textareaStyle (Keep as is)
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
        minHeight: `calc(${fontSize || '16px'} * 1.2)`, // Ensure fontSize has a fallback
        lineHeight: 1.5, // Base line height for the container
   };

   const textareaStyle: React.CSSProperties = {
        width: '100%',
        height: 'auto',
        minHeight: `calc(${fontSize || '16px'} * 1.2)`,
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

  // Update contentDisplayStyle - Remove specific minHeight/lineHeight here,
  // let the Markdown component and its CSS handle the internal structure.
  const contentDisplayStyle: React.CSSProperties = {
       width: '100%',
       overflowWrap: 'break-word',
       // Add other styles if needed, but avoid height/line-height conflicts
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
        className={`relative ${editorEnabled ? 'cursor-grab' : ''} transition-shadow duration-100 hover:shadow-md bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 border-solid`}
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Drag to reorder, double-click to edit" : ""}
        onClick={(e) => {
             if (isEditing) e.stopPropagation();
             if (editorEnabled && !selected) {
                editorActions.selectNode(id);
             }
         }}
         onBlurCapture={(e) => {
            // Use DOM Node type for contains check
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
        // --- Updated Display Mode ---
        <div
            style={contentDisplayStyle}
            // Add a dedicated class for styling the Markdown output
            className="craft-markdown-display prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" // Example using Tailwind Typography, adjust as needed
        >
           <ReactMarkdown
              // --- Add remarkGfm plugin ---
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              // You might want to customize components for finer control,
              // but let's first rely on plugins and CSS.
              // components={{
              //   // Example: Override link rendering
              //   a: ({node, ...props}) => <a style={{ color: 'blue' }} {...props} />
              // }}
           >
              {content || ""}
           </ReactMarkdown>
        </div>
      )}

      {/* Delete Button (Keep as is) */}
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
          aria-label="Delete Text Element"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// --- Update Craft Default Props with Multi-level List Example ---
TextComponent.craft = {
  displayName: "Text",
  props: {
    content: `## Markdown Text
Double-click to edit. Supports **Markdown** including:

*   Item 1
    *   Sub-item 1.1 (indent with 2 or 4 spaces)
        *   Sub-sub-item 1.1.1
    *   Sub-item 1.2
*   Item 2
    *   Sub-item 2.1
*   Item 3

1.  Ordered Item 1
    1.  Ordered Sub 1.1
    2.  Ordered Sub 1.2
2.  Ordered Item 2`,
    width: '100%',
    alignment: "left",
    fontSize: "16px", // Base font size for the component
    color: "#333333",
    fontWeight: "normal",
    padding: "8px",
  } satisfies Partial<TextProps>,
  related: {
    settings: TextSettings,
  },
  rules: {
    canDrag: () => true,
  },
};