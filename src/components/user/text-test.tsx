"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNode, useEditor, Node } from "@craftjs/core";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ResizableElement } from "@/components/Resizer"; // *** ADD BACK ***
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TextSettings } from "@/components/TextSettings";

// --- TextProps and CraftableComponent interfaces (as defined above) ---
export interface TextProps {
    content: string;
    width?: string | number;
    height?: string | number; // Added back
    alignment?: "left" | "center" | "right" | "justify";
    fontSize?: string;
    color?: string;
    fontWeight?: string;
}

interface CraftableComponent extends React.FC<TextProps> {
    craft?: {
      displayName: string;
      props: Partial<TextProps>;
      related?: {
        settings: React.ComponentType<any>;
      };
      rules?: {
        canDrag?: (node: Node) => boolean;
      };
    };
  }


export const TextComponent: CraftableComponent = ({
  content = "Edit me!",
  // Width/Height are now potentially controlled by ResizableElement via Craft.js props
  alignment = "left",
  fontSize = "16px",
  color = "inherit",
  fontWeight = "normal",
  // Destructure width/height but don't set defaults here; use craft.props default
  width,
  height,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
    id,
    // Read width/height from node state if ResizableElement doesn't inject them as props
    // nodeWidth = props.width, // Example if reading directly
    // nodeHeight = props.height
  } = useNode((node) => ({
    selected: node.events.selected,
    // props: node.data.props, // Uncomment if you need direct access here
  }));

  const { actions: editorActions, enabled: editorEnabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Update content prop
      setProp((props: TextProps) => { props.content = localContent; }, 500);
      // *** Important: Trigger height recalculation? ***
      // If ResizableElement doesn't automatically adjust height after content change,
      // you *might* need to manually set height to 'auto' here temporarily, then back,
      // or use a ResizeObserver on the content to update the height prop.
      // For now, let's assume ResizableElement handles or user resizes manually.
      // Example (if needed):
      // setProp((props) => { props.height = 'auto'; });
      // // Potentially reset after a tick if 'auto' breaks resizing:
      // setTimeout(() => setProp(props => { /* set back to measured height if needed */ }), 0);
    }
  }, [setProp, localContent, content]);


  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editorActions.delete(id);
  }, [editorActions, id]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    // Optional: Auto-grow textarea while typing (more complex JS needed usually)
  };

  // --- Styles ---

  // Style for the DIV DIRECTLY INSIDE ResizableElement
  // This div needs to fill the space defined by ResizableElement
  const innerWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%', // Fill the ResizableElement bounds
    position: 'relative', // For positioning delete button
    textAlign: alignment,
    fontSize: fontSize,
    color: color,
    fontWeight: fontWeight,
    padding: '4px', // Padding inside the resizable area
    overflow: 'hidden', // Clip anything exceeding the inner wrapper bounds (scrolling happens inside)
  };

  // Style for the actual content display (Markdown)
  const contentDisplayStyle: React.CSSProperties = {
      width: '100%',
      height: '100%', // Try to fill the parent (innerWrapper)
      overflowY: 'auto', // *** ADD SCROLLING HERE ***
      overflowX: 'hidden', // Hide horizontal overflow
      overflowWrap: 'break-word', // Ensure text wraps
  };

  // Style for the textarea during editing
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%', // Fill the available space
    resize: 'none',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    fontWeight: 'inherit',
    textAlign: alignment,
    padding: 0,
    margin: 0,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    overflowY: 'auto', // Allow scrolling within textarea too
  };

  return (
    // *** Wrap with ResizableElement ***
    <ResizableElement
        // Pass props if your ResizableElement expects them
        // initialWidth={width}
        // initialHeight={height} // Might need 'auto' handling logic
    >
      {/* This div is now the child of ResizableElement */}
      <div
        // *** Connect THIS div (the one with content/styles) ***
        // ResizableElement likely handles the outer dragging/resizing itself.
        // Connect this inner div for selection state, double-click etc.
         ref={(refValue: HTMLDivElement | null) => {
            // Only connect, let ResizableElement handle drag if it does
            if (refValue) connect(refValue);
            // If ResizableElement DOES NOT handle drag, use: connect(drag(refValue))
         }}
        className={`relative cursor-pointer outline outline-1 ${selected && editorEnabled ? 'outline-blue-500 outline-dashed' : 'outline-transparent'}`}
        style={innerWrapperStyle} // Apply style to fill the resizer
        onDoubleClick={selected && editorEnabled ? handleBeginEditing : undefined}
        title={editorEnabled ? "Double-click to edit" : ""}
      >
        {isEditing && editorEnabled ? (
          // --- Editing Mode ---
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleTextareaChange}
            onBlur={handleFinishEditing}
            style={textareaStyle}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag interference
          />
        ) : (
          // --- Display Mode ---
          // Apply scrolling style to this inner container
          <div style={contentDisplayStyle} className="craft-markdown-display">
             <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {content || ""}
             </ReactMarkdown>
          </div>
        )}

        {/* Delete Button */}
        {selected && editorEnabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0 z-20 m-1 h-6 w-6 opacity-80 hover:opacity-100"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleRemove}
            aria-label="Delete Text Element"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </ResizableElement> // *** End ResizableElement wrapper ***
  );
}

TextComponent.craft = {
  displayName: "Text",
  props: {
    // Default Props
    content: "## Document Title\n\nStart typing your Markdown content here. The component has a default width resembling A4 portrait ratio (relative to its container) and you can resize it manually.\n\nIf the content becomes taller than the manually set height, a scrollbar will appear *within* this text box.",
    width: '70%', // *** Default width (A4-ish relative width) *** Use 70% or 75%
    // *** NO default height *** - Let content determine initial height, allow manual resize later
    alignment: "left",
    fontSize: "16px",
    color: "#000000",
    fontWeight: "normal",
  } satisfies Partial<TextProps>, // Use Partial because height might be undefined initially
  related: {
    settings: TextSettings,
  },
  rules: {
    // Let ResizableElement handle drag rules if necessary, or define here
    // canDrag: () => true,
  },
};