"use client"
import { useState, useCallback, useMemo } from "react"
import { useNode, useEditor } from "@craftjs/core"
import { X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slate, Editable, withReact } from "slate-react"
import { Editor, Transforms, createEditor, Element as SlateElement, type Descendant } from "slate"
import { withHistory } from "slate-history"
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from "lucide-react"
import { Resizable } from "re-resizable"
import type React from "react" // Import React

interface TextWidgetProps {
  content: string
  textType: "body" | "heading" | "subheading"
  editable?: boolean
  width?: number
  height?: number
}

interface CustomElement {
  type: "paragraph" | "heading" | "subheading"
  children: CustomText[]
  align?: "left" | "center" | "right" | "justify"
}

interface CustomText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

const initialValue: CustomElement[] = [
  {
    type: "paragraph",
    children: [{ text: "Start typing..." }],
  },
]

const serialize = (value: Descendant[]) => JSON.stringify(value)
const deserialize = (value: string) => {
  try {
    return JSON.parse(value)
  } catch (e) {
    return initialValue
  }
}

export function TextWidget({
  content: initialContent,
  textType: initialTextType,
  editable = true,
  width = 300,
  height = 200,
}: TextWidgetProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [value, setValue] = useState<Descendant[]>(deserialize(initialContent))

  const {
    connectors: { connect, drag },
    actions: { setProp },
    id,
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
  }))

  const {
    actions: { delete: deleteNode },
  } = useEditor()

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deleteNode(id)
    },
    [deleteNode, id],
  )

  const handleTextTypeChange = useCallback(
    (newTextType: TextWidgetProps["textType"]) => {
      const typeMap = {
        body: "paragraph",
        heading: "heading",
        subheading: "subheading",
      } as const

      Transforms.setNodes(editor, { type: typeMap[newTextType] } as Partial<CustomElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })

      setProp((props: TextWidgetProps) => {
        props.textType = newTextType
      })
    },
    [editor, setProp],
  )

  const renderElement = useCallback((props: any) => {
    const { element, children, attributes } = props
    const align = element.align || "left"
    const style = { textAlign: align }

    switch (element.type) {
      case "heading":
        return (
          <h1 className="text-2xl font-bold mb-2" style={style} {...attributes}>
            {children}
          </h1>
        )
      case "subheading":
        return (
          <h2 className="text-xl font-semibold mb-2" style={style} {...attributes}>
            {children}
          </h2>
        )
      case "paragraph":
      default:
        return (
          <p className="text-base mb-2" style={style} {...attributes}>
            {children}
          </p>
        )
    }
  }, [])

  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props
    return (
      <span
        {...attributes}
        className={`${leaf.bold ? "font-bold" : ""} 
                   ${leaf.italic ? "italic" : ""} 
                   ${leaf.underline ? "underline" : ""}`}
      >
        {children}
      </span>
    )
  }, [])

  const toggleMark = useCallback(
    (format: keyof Omit<CustomText, "text">) => {
      const isActive = isMarkActive(format)
      if (isActive) {
        Editor.removeMark(editor, format)
      } else {
        Editor.addMark(editor, format, true)
      }
    },
    [editor],
  )

  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format as keyof typeof marks] === true : false
  }

  const handleAlignment = useCallback(
    (alignment: "left" | "center" | "right" | "justify") => {
      Transforms.setNodes(
        editor,
        { align: alignment } as Partial<CustomElement>,
        { match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n) },
      )
    },
    [editor],
  )

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement, d: { width: number; height: number }) => {
      setProp((props: TextWidgetProps) => {
        props.width = ref.offsetWidth
        props.height = ref.offsetHeight
      })
    },
    [setProp],
  )

  return (
    <Resizable size={{ width, height }} onResizeStop={handleResize} minWidth={200} minHeight={100}>
      <div
        ref={(ref) => {
          if (ref) connect(drag(ref))
        }}
        className={`relative bg-white p-1 rounded-lg ${
          selected ? "border-2 border-blue-500" : "border border-gray-200"
        }`}
        style={{ width: "100%", height: "100%" }}
      >
        {selected && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600"
            aria-label="Delete widget"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {editable && selected ? (
          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="align">Align</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
            </TabsList>
            <TabsContent value="format" className="flex space-x-2 py-2">
              <button onClick={() => toggleMark("bold")} className="p-1 hover:bg-gray-100 rounded">
                <Bold className="h-4 w-4" />
              </button>
              <button onClick={() => toggleMark("italic")} className="p-1 hover:bg-gray-100 rounded">
                <Italic className="h-4 w-4" />
              </button>
              <button onClick={() => toggleMark("underline")} className="p-1 hover:bg-gray-100 rounded">
                <Underline className="h-4 w-4" />
              </button>
            </TabsContent>
            <TabsContent value="align" className="flex space-x-2 py-2">
              <button onClick={() => handleAlignment("left")} className="p-1 hover:bg-gray-100 rounded">
                <AlignLeft className="h-4 w-4" />
              </button>
              <button onClick={() => handleAlignment("center")} className="p-1 hover:bg-gray-100 rounded">
                <AlignCenter className="h-4 w-4" />
              </button>
              <button onClick={() => handleAlignment("right")} className="p-1 hover:bg-gray-100 rounded">
                <AlignRight className="h-4 w-4" />
              </button>
              <button onClick={() => handleAlignment("justify")} className="p-1 hover:bg-gray-100 rounded">
                <AlignJustify className="h-4 w-4" />
              </button>
            </TabsContent>
            <TabsContent value="type" className="flex space-x-2 py-2">
              <button onClick={() => handleTextTypeChange("body")} className="p-1 hover:bg-gray-100 rounded text-sm">
                Body
              </button>
              <button onClick={() => handleTextTypeChange("heading")} className="p-1 hover:bg-gray-100 rounded text-sm">
                Heading
              </button>
              <button
                onClick={() => handleTextTypeChange("subheading")}
                className="p-1 hover:bg-gray-100 rounded text-sm"
              >
                Subheading
              </button>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="h-full p-2">
          <Slate
            editor={editor}
            initialValue={value}
            onChange={(newValue) => {
              setValue(newValue)
              setProp((props: { content: string }) => {
                props.content = serialize(newValue)
              })
            }}
          >
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              className="focus:outline-none h-full"
              readOnly={!editable}
            />
          </Slate>
        </div>
      </div>
    </Resizable>
  )
}

export const CraftTextWidget = ({ content, textType, width, height }: TextWidgetProps) => {
  return <TextWidget content={content} textType={textType} width={width} height={height} />
}

CraftTextWidget.craft = {
  displayName: "Rich Text Widget",
  props: {
    content: serialize(initialValue),
    textType: "body",
    width: 300,
    height: 200,
  },
  rules: {
    canDrag: () => true,  
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
}

