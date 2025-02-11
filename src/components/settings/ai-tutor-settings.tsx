"use client"

import { useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export const AITutorSettings = () => {
  const {
    actions: { setProp },
    topic,
    initialPrompt,
  } = useNode((node) => ({
    topic: node.data.props.topic,
    initialPrompt: node.data.props.initialPrompt,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Topic</Label>
        <Input type="text" value={topic} onChange={(e) => setProp((props: any) => (props.topic = e.target.value))} />
      </div>
      <div className="space-y-2">
        <Label>Initial Prompt</Label>
        <Textarea
          value={initialPrompt}
          onChange={(e) => setProp((props: any) => (props.initialPrompt = e.target.value))}
        />
      </div>
    </div>
  )
}

