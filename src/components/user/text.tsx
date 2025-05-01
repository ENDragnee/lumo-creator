// components/user/text.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node as CraftNode } from "@craftjs/core";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';    // <--- Import remark-math
import rehypeKatex from 'rehype-katex';  // <--- Import rehype-katex
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
        canDrag?: (node: CraftNode) => boolean;
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
  content = "Edit me!", // Update default content below
  alignment = "left",
  fontSize = "16px",
  color = "inherit", // Use inherit to better respect container style
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
    setLocalContent(content); // Use the current prop content when starting edit
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
    // Only update if content actually changed (trimming whitespace for comparison)
    if (localContent.trim() !== content.trim()) {
        // Update the prop with the raw content from the textarea
        setProp((props: TextProps) => { props.content = localContent; }, 100);
    }
  }, [setProp, localContent, content, isEditing]);


  // --- Handle Element Removal --- (Keep as is)
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editorActions.delete(id);
  }, [editorActions, id]);

  // --- Styles --- (Keep rootStyle and textareaStyle as is)
   const rootStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        position: 'relative',
        textAlign: alignment,
        fontSize: fontSize,
        color: color === 'inherit' ? undefined : color, // Apply color unless 'inherit'
        fontWeight: fontWeight,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        outline: selected && editorEnabled ? '2px dashed blue' : 'none',
        outlineOffset: '2px',
        transition: 'outline 0.1s ease-in-out',
        minHeight: `calc(${fontSize || '16px'} * 1.2)`,
        lineHeight: 1.5,
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
        color: 'inherit', // Textarea should always inherit color for editing
        fontWeight: 'inherit',
        textAlign: alignment,
        padding: 0,
        margin: 0,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        overflowY: 'hidden',
        lineHeight: 1.5,
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
        className={`relative ${editorEnabled ? 'cursor-grab' : ''} transition-shadow duration-100 hover:shadow-md bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 border-solid`}
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Drag to reorder, double-click to edit" : ""}
        onClick={(e) => {
             if (isEditing) e.stopPropagation(); // Prevent click-away when clicking inside textarea
             if (editorEnabled && !selected) {
                editorActions.selectNode(id);
             }
         }}
         onBlurCapture={(e) => {
            // Check if the new focused element is *outside* the root container
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
          onClick={(e) => e.stopPropagation()} // Prevent triggering root onClick
          onMouseDown={(e) => e.stopPropagation()} // Prevent triggering drag
          rows={1}
        />
      ) : (
        // --- Updated Display Mode with Math Support ---
        <div
            style={contentDisplayStyle}
            className="craft-markdown-display prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
        >
           <ReactMarkdown
              // --- Add Math Plugins ---
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[
                  rehypeSanitize, // Sanitize first
                  [rehypeKatex, { output: 'mathml' }] // Then render KaTeX
              ]}
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
              e.preventDefault(); // Prevent focus loss/blur when clicking delete
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

// --- Update Craft Default Props with LaTeX Example ---
TextComponent.craft = {
  displayName: "Text (Markdown/LaTeX)", // Updated display name
  props: {
    // --- Example Content with Markdown and LaTeX ---
    content: `## Markdown & LaTeX Example
Double-click to edit this text.

Supports **Markdown** features like lists:
* Item 1
* Item 2

And LaTeX for math:
Inline math uses single dollars: $E = mc^2$.

Display math uses double dollars:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

You can mix them freely. Remember to escape backslashes in the editor: use \`\\\\\` for a literal backslash in math mode (e.g., \`\\\\frac\`).
`,
    width: '100%',
    alignment: "left",
    fontSize: "16px",
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