"use client"

import { useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export const SliderSettings = () => {
  const {
    actions: { setProp },
    min,
    max,
    step,
  } = useNode((node) => ({
    min: node.data.props.min,
    max: node.data.props.max,
    step: node.data.props.step,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Min Value</Label>
        <Input
          type="number"
          value={min}
          onChange={(e) => setProp((props: any) => (props.min = Number(e.target.value)))}
        />
      </div>
      <div className="space-y-2">
        <Label>Max Value</Label>
        <Input
          type="number"
          value={max}
          onChange={(e) => setProp((props: any) => (props.max = Number(e.target.value)))}
        />
      </div>
      <div className="space-y-2">
        <Label>Step</Label>
        <Input
          type="number"
          value={step}
          onChange={(e) => setProp((props: any) => (props.step = Number(e.target.value)))}
        />
      </div>
    </div>
  )
}

