import { useNode } from "@craftjs/core"
import { ResizeHandle } from "@/components/resize-handle"

export function VideoComponent({ src = "https://example.com/video.mp4" }) {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  return (
    <div
      ref={(ref) => {connect(drag(ref!))}}
      className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
    >
      <video src={src} controls className="w-full h-full" />
      {selected && <ResizeHandle />}
    </div>
  )
}

VideoComponent.craft = {
  displayName: "Video",
  props: {
    src: "",
  },
}

