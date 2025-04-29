// components/user/text.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node } from "@craftjs/core";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
// import { ResizableElement } from "@/components/Resizer"; // *** REMOVE THIS ***
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/TextSettings"; // Keep settings

// --- TextProps Interface ---
export interface TextProps {
    content: string;
    width?: string | number; // Keep width control
    // height?: string | number; // Height is now generally auto based on content
    alignment?: "left" | "center" | "right" | "justify";
    fontSize?: string;
    color?: string;
    fontWeight?: string;
    padding?: string | number; // Add padding control
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
        canDrag?: (node: Node) => boolean;
        // canDrop?: (node: Node) => boolean; // Can it accept children? Usually no for Text.
        // canMoveIn?: (incomingNodes: Node[], self: Node, helpers: NodeHelpers) => boolean;
        // canMoveOut?: (outgoingNodes: Node[], self: Node, helpers: NodeHelpers) => boolean;
      };
    };
  }


export const TextComponent: CraftableComponent = ({
  content = "Edit me!",
  alignment = "left",
  fontSize = "16px",
  color = "inherit",
  fontWeight = "normal",
  width = "100%", // Default to full width in stacking layout
  padding = "8px", // Default internal padding
}) => {
  const {
    connectors: { connect, drag }, // Use both connectors on the root
    selected,
    actions: { setProp },
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    // props: node.data.props, // Access props if needed
  }));

  const { actions: editorActions, enabled: editorEnabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null); // Ref for the root element

  // --- State Syncing ---
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // --- Handlers ---
  const handleBeginEditing = () => {
    if (!editorEnabled) return;
    setIsEditing(true);
    setLocalContent(content);
  };

  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    if (localContent !== content) {
      setProp((props: TextProps) => { props.content = localContent; }, 500);
      // Height will adjust naturally based on content in stacking layout
    }
  }, [setProp, localContent, content]);


  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering selection/edit
    editorActions.delete(id);
  }, [editorActions, id]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    // Auto-grow textarea height (simple approach)
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to content height
    }
  };

  // --- Styles ---

  // Style for the ROOT div (the draggable, connectable element)
  const rootStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width, // Handle number or string width
    // Height is auto by default
    position: 'relative', // Needed for absolute positioning of delete button
    textAlign: alignment,
    fontSize: fontSize,
    color: color,
    fontWeight: fontWeight,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    // Add outline for selection state directly here
    outline: selected && editorEnabled ? '2px dashed blue' : 'none',
    outlineOffset: '2px',
    transition: 'outline 0.1s ease-in-out', // Smooth transition for outline
  };

   // Style for the actual content display (Markdown)
   // Needs to handle potential overflow if height were constrained, but usually won't be
   const contentDisplayStyle: React.CSSProperties = {
       width: '100%',
       minHeight: '1.2em', // Ensure it has some height even when empty
       overflowWrap: 'break-word', // Ensure text wraps
       // No overflow: auto needed unless you set a max-height
   };

   // Style for the textarea during editing
   const textareaStyle: React.CSSProperties = {
     width: '100%',
     height: 'auto', // Start auto, will be adjusted by handleTextareaChange
     minHeight: '1.2em',
     resize: 'none',
     border: 'none',
     outline: 'none',
     background: 'rgba(0, 0, 0, 0.05)', // Slight background to indicate editing
     fontFamily: 'inherit',
     fontSize: 'inherit',
     color: 'inherit',
     fontWeight: 'inherit',
     textAlign: alignment,
     padding: 0, // Padding is on the parent
     margin: 0,
     whiteSpace: 'pre-wrap',
     overflowWrap: 'break-word',
     overflowY: 'hidden', // Hide scrollbar, height adjusts instead
   };

  return (
    // *** NO ResizableElement wrapper ***
    // Apply connectors and styles directly to this div
    <div
        ref={(ref) => {
            if (ref) {
                connect(drag(ref)); // Apply both connectors here
                rootRef.current = ref; // Store ref if needed elsewhere
            }
        }}
        style={rootStyle}
        className={`relative ${editorEnabled ? 'cursor-grab' : 'cursor-default'} transition-shadow duration-100 hover:shadow-md`} // Add hover effect maybe
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Drag to reorder, double-click to edit" : ""}
        onClick={(e) => {
             // Prevent double-click from propagating if already editing
             if (isEditing) e.stopPropagation();
         }}
    >
      {/* Conditional Rendering for Edit/Display */}
      {isEditing && editorEnabled ? (
        // --- Editing Mode ---
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleTextareaChange}
          onBlur={handleFinishEditing}
          style={textareaStyle}
          onClick={(e) => e.stopPropagation()} // Prevent selection changes
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
        />
      ) : (
        // --- Display Mode ---
        <div style={contentDisplayStyle} className="craft-markdown-display">
           <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {content || ""}
           </ReactMarkdown>
        </div>
      )}

      {/* Delete Button - positioned relative to the root div */}
      {selected && editorEnabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-0 right-0 z-10 -mt-2 -mr-2 h-5 w-5 opacity-80 hover:opacity-100" // Adjusted position/size
          onMouseDown={(e) => e.stopPropagation()} // Crucial to prevent drag
          onClick={handleRemove} // Use onClick for accessibility
          aria-label="Delete Text Element"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Update Craft settings
TextComponent.craft = {
  displayName: "Text",
  props: {
    // Default Props for stacking layout
    content: "## New Text Block\n\nDouble-click to edit this Markdown content. Drag to reorder.",
    width: '100%', // Default to full width of the canvas container
    // No height prop by default - let content determine it
    alignment: "left",
    fontSize: "16px",
    color: "#333333", // Darker default color
    fontWeight: "normal",
    padding: "8px", // Default internal padding
  } satisfies Partial<TextProps>, // Use Partial as some props are optional
  related: {
    settings: TextSettings, // Keep link to settings panel
  },
  rules: {
    canDrag: () => true, // Allow dragging (for reordering)
    // Text components typically cannot have children dropped inside them
    // canMoveIn: () => false,
  },
};