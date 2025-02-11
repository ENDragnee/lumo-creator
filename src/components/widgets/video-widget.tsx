// "use client"

// import { useState, useCallback } from "react"
// import { useNode } from "@craftjs/core"
// import { Button } from "@/components/ui/button"
// import { DragDropFile } from "@/components/drag-drop-file"

// interface VideoWidgetProps {
//   src?: string
// }

// export function VideoWidget({ src: initialSrc = "" }: VideoWidgetProps) {
//   const [src, setSrc] = useState<string>(initialSrc)

//   const {
//     connectors: { connect, drag },
//   } = useNode()

//   const handleFileDrop = useCallback((file: File) => {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       if (typeof e.target?.result === "string") {
//         setSrc(e.target.result)
//       }
//     }
//     reader.readAsDataURL(file)
//   }, [])

//   const handleFileInput = useCallback(
//     (event: React.ChangeEvent<HTMLInputElement>) => {
//       const file = event.target.files?.[0]
//       if (file) {
//         handleFileDrop(file)
//       }
//     },
//     [handleFileDrop],
//   )

//   return (
//     <div
//       ref={(ref) => {
//         if (ref) connect(drag(ref))
//       }}
//       className="relative min-w-[200px] min-h-[200px]"
//     >
//       <DragDropFile onFileDrop={handleFileDrop} accept={{ "video/*": [] }}>
//         {src ? (
//           <video src={src} controls className="w-full h-full" />
//         ) : (
//           <p>Drag and drop a video here, or click to select a file</p>
//         )}
//       </DragDropFile>
//       <input type="file" accept="video/*" onChange={handleFileInput} className="hidden" id="video-upload" />
//       <Button
//         variant="outline"
//         size="sm"
//         onClick={() => document.getElementById("video-upload")?.click()}
//         className="absolute bottom-2 right-2"
//       >
//         Browse
//       </Button>
//     </div>
//   )
// }

// export const CraftVideoWidget = ({ src }: VideoWidgetProps) => {
//   return <VideoWidget src={src} />
// }

// CraftVideoWidget.craft = {
//   displayName: "Video",
//   props: {
//     src: "",
//   },
//   rules: {
//     canDrag: () => true,
//     canDrop: () => true,
//     canMoveIn: () => true,
//     canMoveOut: () => true,
//   },
// }

