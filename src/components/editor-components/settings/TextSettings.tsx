"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TextProps } from "../TextComponent";

export const TextSettings = () => {
  const {
    actions: { setProp },
    text,
    fontSize,
    alignment,
    fontWeight,
    tagName,
    color,
    backgroundColor,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    alignment: node.data.props.alignment,
    fontWeight: node.data.props.fontWeight,
    tagName: node.data.props.tagName,
    color: node.data.props.color, // <-- ADDED: Get text color
    backgroundColor: node.data.props.backgroundColor, // <-- ADDED: Get background color
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Text Content</Label>
        <Textarea
          value={text}
          onChange={(e) =>
            setProp((props: TextProps) => (props.text = e.target.value), 500)
          }
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Font Size</Label>
          <Input
            type="text"
            value={fontSize}
            onChange={(e) =>
              setProp((props: TextProps) => (props.fontSize = e.target.value))
            }
          />
        </div>
        <div>
          <Label>Font Weight</Label>
          <Select
            value={fontWeight}
            onValueChange={(value) =>
              setProp((props: TextProps) => (props.fontWeight = value))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="700">700</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Alignment</Label>
          <Select
            value={alignment}
            onValueChange={(value) =>
              setProp(
                (props: TextProps) => (props.alignment = value as any)
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tag</Label>
          <Select
            value={tagName}
            onValueChange={(value) =>
              setProp((props: TextProps) => (props.tagName = value as any))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- ADDED: Color Pickers Section --- */}
      <div className="border-t pt-4 mt-4 space-y-3">
        <div>
          <Label>Text Color</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="color"
              value={color === "inherit" || !color ? "#000000" : color}
              onChange={(e) =>
                setProp((props: TextProps) => (props.color = e.target.value))
              }
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={color || ""}
              onChange={(e) =>
                setProp((props: TextProps) => (props.color = e.target.value))
              }
              placeholder="e.g., #333333"
            />
          </div>
        </div>

        <div>
          <Label>Background Color</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="color"
              value={
                backgroundColor === "transparent" || !backgroundColor
                  ? "#ffffff"
                  : backgroundColor
              }
              onChange={(e) =>
                setProp(
                  (props: TextProps) => (props.backgroundColor = e.target.value)
                )
              }
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={backgroundColor || ""}
              onChange={(e) =>
                setProp(
                  (props: TextProps) => (props.backgroundColor = e.target.value)
                )
              }
              placeholder="e.g., transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
