"use client"

import { useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export const ImageSettings = () => {
  const {
    actions: { setProp },
    src,
    alt,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Image Source</Label>
        <Input type="text" value={src} onChange={(e) => setProp((props: any) => (props.src = e.target.value))} />
      </div>
      <div className="space-y-2">
        <Label>Alt Text</Label>
        <Input type="text" value={alt} onChange={(e) => setProp((props: any) => (props.alt = e.target.value))} />
      </div>
    </div>
  )
}

