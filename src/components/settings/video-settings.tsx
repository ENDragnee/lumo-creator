"use client"

import { useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export const VideoSettings = () => {
  const {
    actions: { setProp },
    src,
    autoplay,
    controls,
  } = useNode((node) => ({
    src: node.data.props.src,
    autoplay: node.data.props.autoplay,
    controls: node.data.props.controls,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Video Source</Label>
        <Input type="text" value={src} onChange={(e) => setProp((props: any) => (props.src = e.target.value))} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="autoplay"
          checked={autoplay}
          onCheckedChange={(checked) => setProp((props: any) => (props.autoplay = checked))}
        />
        <Label htmlFor="autoplay">Autoplay</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="controls"
          checked={controls}
          onCheckedChange={(checked) => setProp((props: any) => (props.controls = checked))}
        />
        <Label htmlFor="controls">Show Controls</Label>
      </div>
    </div>
  )
}

