"use client";

import { useState, useCallback, useMemo } from "react";
import { useNode } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { Editor, Transforms, createEditor, Descendant, Element } from "slate";
import { withHistory } from "slate-history";

interface TextWidgetProps {
  content: string;
  textType: "body" | "heading" | "subheading";
  editable?: boolean;
}

interface CustomElement {
  type: "paragraph" | "heading" | "subheading";
  children: CustomText[];
}

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const initialValue: CustomElement[] = [
  {
    type: "paragraph",
    children: [{ text: "Start typing..." }],
  },
];

const serialize = (value: Descendant[]) => JSON.stringify(value);
const deserialize = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return initialValue;
  }
};

export function TextWidget({
  content: initialContent,
  textType: initialTextType,
  editable = true,
}: TextWidgetProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(deserialize(initialContent));

  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
    content: node.data.props.content,
    textType: node.data.props.textType,
  }));

  const handleTextTypeChange = useCallback(
    (newTextType: TextWidgetProps["textType"]) => {
      const typeMap = {
        body: "paragraph",
        heading: "heading",
        subheading: "subheading",
      } as const;

      Transforms.setNodes(
        editor,
        { type: typeMap[newTextType] } as Partial<CustomElement>,
        {
          match: (n): n is CustomElement => {
            return Element.isElement(n) &&
                   Editor.isBlock(editor, n) && 
                   !Editor.isEditor(n);
          }
        }
      );

      setProp((props: TextWidgetProps) => {
        props.textType = newTextType;
      });
    },
    [editor, setProp]
  );
  const renderElement = useCallback((props: any) => {
    const { element, children, attributes } = props;
    switch (element.type) {
      case "heading":
        return (
          <h1 className="text-2xl font-bold mb-2" {...attributes}>
            {children}
          </h1>
        );
      case "subheading":
        return (
          <h2 className="text-xl font-semibold mb-2" {...attributes}>
            {children}
          </h2>
        );
      case "paragraph":
      default:
        return (
          <p className="text-base mb-2" {...attributes}>
            {children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    return (
      <span
        {...attributes}
        className={`${leaf.bold ? "font-bold" : ""} 
                   ${leaf.italic ? "italic" : ""} 
                   ${leaf.underline ? "underline" : ""}`}
      >
        {children}
      </span>
    );
  }, []);

  const toggleMark = useCallback(
    (format: keyof Omit<CustomText, "text">) => {
      const isActive = isMarkActive(format);
      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    },
    [editor]
  );

  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, any>)[format] === true : false;
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`relative min-w-[200px] min-h-[100px] ${
        selected ? "border-2 border-blue-500" : ""
      }`}
    >
      {editable ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="h-full p-2">
              <Slate
                editor={editor}
                initialValue={value}
                onChange={(newValue) => {
                  setValue(newValue);
                  setProp((props: { content: string }) => {
                    props.content = serialize(newValue);
                  });
                }}
              >
                <Editable
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  className="focus:outline-none"
                  readOnly={!editable}
                />
              </Slate>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-64">
            <ContextMenuSub>
              <ContextMenuSubTrigger>Text Type</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleTextTypeChange("body")}>
                  Body
                  {initialTextType === "body" && (
                    <ContextMenuShortcut>✓</ContextMenuShortcut>
                  )}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTextTypeChange("heading")}>
                  Heading
                  {initialTextType === "heading" && (
                    <ContextMenuShortcut>✓</ContextMenuShortcut>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTextTypeChange("subheading")}
                >
                  Subheading
                  {initialTextType === "subheading" && (
                    <ContextMenuShortcut>✓</ContextMenuShortcut>
                  )}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => toggleMark("bold")}>
              Bold <ContextMenuShortcut>⌘B</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => toggleMark("italic")}>
              Italic <ContextMenuShortcut>⌘I</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => toggleMark("underline")}>
              Underline <ContextMenuShortcut>⌘U</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ): (
      <div className="h-full p-2">
        <Slate editor={editor} initialValue={value}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            className="focus:outline-none"
            readOnly={true}
          />
        </Slate>
      </div>
      )}
    </div>
  );
}

export function GTextWidget ({
  content: initialContent,
  textType: initialTextType,
} : TextWidgetProps
) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(deserialize(initialContent));
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
    content: node.data.props.content,
    textType: node.data.props.textType,
  }));

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case "heading":
        return (
          <h1 className="text-2xl font-bold mb-2" {...props.attributes}>
            {props.children}
          </h1>
        );
      case "subheading":
        return (
          <h2 className="text-xl font-semibold mb-2" {...props.attributes}>
            {props.children}
          </h2>
        );
      case "paragraph":
      default:
        return (
          <p className="text-base mb-2" {...props.attributes}>
            {props.children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return (
      <span
        {...props.attributes}
        className={`${props.leaf.bold ? "font-bold" : ""} 
                   ${props.leaf.italic ? "italic" : ""} 
                   ${props.leaf.underline ? "underline" : ""}`}
      >
        {props.children}
      </span>
    );
  }, []);


  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`relative min-w-[200px] min-h-[100px] ${
        selected ? "border-2 border-blue-500" : ""
      }`}
    >
      <div className="h-full p-2">
        <Slate editor={editor} initialValue={value}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            className="focus:outline-none"
            readOnly={true}
          />
        </Slate>
      </div>
    </div>
  );
}
// CraftJS wrapper component
export const CraftTextWidget = ({ content, textType }: TextWidgetProps) => {
  return <TextWidget content={content} textType={textType} />;
};

// CraftJS configuration for the component
CraftTextWidget.craft = {
  displayName: "Rich Text Widget",
  props: {
    content: serialize(initialValue),
    textType: "body",
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};

export const TextViewerComponent = ({ content, textType }: TextWidgetProps) => {
  return <GTextWidget content={content} textType={textType} />;
};
