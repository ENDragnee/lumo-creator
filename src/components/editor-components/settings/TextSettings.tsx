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
import { TextProps } from "../TextComponent"; // <-- Updated path

export const TextSettings = () => {
  const {
    actions: { setProp },
    text, // <-- Use 'text'
    fontSize,
    alignment,
    fontWeight,
    tagName,
  } = useNode((node) => ({
    text: node.data.props.text, // <-- Use 'text'
    fontSize: node.data.props.fontSize,
    alignment: node.data.props.alignment,
    fontWeight: node.data.props.fontWeight,
    tagName: node.data.props.tagName,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Text Content</Label>
        <Textarea
          value={text} // <-- Use 'text'
          onChange={(e) => setProp((props: TextProps) => (props.text = e.target.value), 500)} // <-- Use 'text'
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Font Size</Label>
          <Input
            type="text"
            value={fontSize}
            onChange={(e) => setProp((props: TextProps) => (props.fontSize = e.target.value))}
          />
        </div>
        <div>
          <Label>Font Weight</Label>
          <Select
            value={fontWeight}
            onValueChange={(value) => setProp((props: TextProps) => (props.fontWeight = value))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            onValueChange={(value) => setProp((props: TextProps) => (props.alignment = value as any))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            onValueChange={(value) => setProp((props: TextProps) => (props.tagName = value as any))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
            </SelectContent>
          </Select>
        </div>
       </div>

    </div>
  );
};
