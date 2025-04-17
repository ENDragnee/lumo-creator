"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node } from "@craftjs/core"; // Added Node type
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize'; // Optional but recommended for security
import { ResizableElement } from "@/components/Resizer"; // Assuming this component works as intended
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/TextSettings"; // Assume this exists

export interface TextProps {
  content: string; // Stores raw Markdown content
  // Props managed by ResizableElement/Craft.js core via useNode:
  // x?: number;
  // y?: number;
  // width?: string | number;
  // height?: string | number;
  alignment?: "left" | "center" | "right" | "justify";
  fontSize?: string; // e.g., '16px', '1rem'
  // Add other text styling props as needed (color, fontWeight, etc.)
  color?: string;
  fontWeight?: string;
}

// Define CraftableComponent interface correctly
interface CraftableComponent extends React.FC<TextProps> {
  craft?: {
    displayName: string;
    props: Partial<TextProps>; // Use Partial for default props is fine
    related?: {
      settings: React.ComponentType<any>;
    };
    rules?: {
      canDrag?: (node: Node) => boolean; // Use imported Node type
      // Add other rules if needed
    };
    custom?: Record<string, any>; // Add custom if you use it
    parent?: string | string[]; // Add parent if needed
    isCanvas?: boolean; // Add isCanvas if needed
  };
}


export const TextComponent: CraftableComponent = ({
  content = "Edit me!", // Default content if prop is undefined initially
  alignment = "left",
  fontSize = "16px",
  color = "inherit", // Default color
  fontWeight = "normal", // Default font weight
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
    // You can access width/height directly from node state if needed,
    // but ResizableElement likely handles this internally.
    // nodeProps,
  } = useNode((node) => ({
    selected: node.events.selected,
    // nodeProps: node.data.props, // If you need width/height etc. here
  }));

  const { actions: editorActions, enabled: editorEnabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  // Local state holds the raw Markdown during editing
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state with external prop ONLY when not editing
  // or when the component initially receives content
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);

  // Focus the textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select(); // Select all text on focus
    }
  }, [isEditing]);

  const handleBeginEditing = () => {
    if (!editorEnabled) return; // Don't allow editing if editor is disabled
    setIsEditing(true);
    // Sync local state from prop one last time before editing starts
    setLocalContent(content);
  };

  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    // Only update if content actually changed
    if (localContent !== content) {
      // Type assertion for setProp if needed, but TextProps should be inferred
      setProp((props: TextProps) => {
        props.content = localContent;
      }, 500); // Debounce save slightly
    }
  }, [setProp, localContent, content]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit handlers
    editorActions.delete(id);
  }, [editorActions, id]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  // Shared style object for both display and editing wrapper
  const commonStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    textAlign: alignment,
    fontSize: fontSize,
    color: color,
    fontWeight: fontWeight,
    // Add overflow handling if needed, e.g., overflow: 'auto' or 'hidden'
    overflow: 'hidden', // Or 'auto' depending on desired behavior
    // Ensure minimum size for usability if needed
    minWidth: '20px',
    minHeight: '20px',
    padding: '4px', // Add some padding
  };

  return (
    <ResizableElement>
      <div
        // *** FIX 1 (Revised): Use a ref callback that returns void ***
        ref={(refValue: HTMLDivElement | null) => {
            // Pass the actual DOM element (or null) to the drag connector,
            // then pass the result of drag to the connect connector.
            if (refValue) {
              connect(drag(refValue));
            }
        }}
        className={`relative w-full h-full cursor-pointer outline outline-1 ${selected && editorEnabled ? 'outline-blue-500 outline-dashed' : 'outline-transparent'}`}
        style={commonStyles}
        // Double click to edit ONLY if editor is enabled and component is selected
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Double-click to edit" : ""} // Tooltip hint
      >
        {isEditing && editorEnabled ? (
          // --- Editing Mode (Textarea) ---
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleTextareaChange}
            onBlur={handleFinishEditing}
            // Basic styling to match display somewhat + reset browser defaults
            style={{
              width: '100%',
              height: '100%',
              resize: 'none', // Important for ResizableElement
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit', // Inherit font from wrapper
              fontSize: 'inherit', // Inherit font size
              color: 'inherit', // Inherit color
              fontWeight: 'inherit', // Inherit font weight
              textAlign: alignment, // Apply text alignment
              padding: 0, // Remove default padding if wrapper has it
              margin: 0, // Remove default margin
              whiteSpace: 'pre-wrap', // Preserve whitespace like Markdown expects
              overflowWrap: 'break-word',
            }}
            // Stop propagation to prevent ResizableElement from interfering during typing
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start while editing
          />
        ) : (
          // --- Display Mode (ReactMarkdown) ---
          // Add a class for potential global styling via CSS
          <div className="craft-markdown-display w-full h-full">
             <ReactMarkdown
                // Optional: Add security plugin
                rehypePlugins={[rehypeSanitize]}
                // Allow specific HTML elements if needed (use with caution)
                // components={{ ... }}
             >
                {content || ""}
             </ReactMarkdown>
          </div>
        )}

        {/* Delete Button - Show only when selected and editor is enabled */}
        {selected && editorEnabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0 z-20 m-1 h-6 w-6 opacity-80 hover:opacity-100" // Smaller, positioned slightly inside
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
            onClick={handleRemove} // Use the memoized handler
            aria-label="Delete Text Element"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </ResizableElement>
  );
}

TextComponent.craft = {
  displayName: "Text",
  props: {
    // Default Props
    content: "## Hello World\n\nThis is **Markdown** text. Double-click to edit!",
    alignment: "left",
    fontSize: "16px",
    color: "#000000",
    fontWeight: "normal",
    // Width and height removed previously - Correct.
  } satisfies TextProps, // Use 'satisfies' for type checking defaults against the interface
  related: {
    settings: TextSettings, // Link to the settings panel component
  },
  // Add rules if necessary, e.g., prevent dragging text elements
  // rules: {
  //   canDrag: (node) => node.data.custom.draggable !== false,
  // },
};