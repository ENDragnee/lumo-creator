"use client"

import { useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const TextSettings = () => {
  const {
    actions: { setProp },
    fontSize,
    fontWeight,
    textAlign,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    textAlign: node.data.props.textAlign,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Font Size</Label>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setProp((props: any) => (props.fontSize = e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Font Weight</Label>
        <Select value={fontWeight} onValueChange={(value) => setProp((props: any) => (props.fontWeight = value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Text Align</Label>
        <Select value={textAlign} onValueChange={(value) => setProp((props: any) => (props.textAlign = value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

