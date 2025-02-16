"use client"

import { useState } from "react"
import { Editor, Frame, Element } from "@craftjs/core"
import { Sidebar } from "@/components/sidebar"
import { Canvas } from "@/components/canvas"
import { Navbar } from "@/components/navbar"
import { Toolbar } from "@/components/widget-toolbar"
import { ImageComponent } from "@/components/user/image"
import { TextComponent } from "@/components/user/text"
import { VideoComponent } from "@/components/user/video"
import { QuizComponent } from "@/components/user/quiz"
import { SliderComponent } from "@/components/user/slider"
import { AITutorComponent } from "@/components/user/ai-tutor"
import { useEditorStore } from "@/lib/editor-store"

export default function TemplateEditor() {
  const { enabled } = useEditorStore()
  const [isVideoSectionVisible, setIsVideoSectionVisible] = useState(false)
  const [isImageSectionVisible, setIsImageSectionVisible] = useState(false)

  const handleVideoButtonClick = () => {
    setIsVideoSectionVisible((prev) => !prev)
  }

  const handleImageButtonClick = () => {
    setIsImageSectionVisible((prev) => !prev)
  }

  return (
    <Editor
      resolver={{
        Canvas,
        Image: ImageComponent,
        Text: TextComponent,
        Video: VideoComponent,
        Quiz: QuizComponent,
        Slider: SliderComponent,
        AITutor: AITutorComponent,
      }}
      enabled={enabled}
    >
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isVideoSectionVisible={isVideoSectionVisible} isImageSectionVisible={isImageSectionVisible} />
          <Frame>
            <Element is={Canvas} canvas>
            </Element>
          </Frame>
        </div>
        <Toolbar onVideoButtonClick={handleVideoButtonClick} onImageButtonClick={handleImageButtonClick} />
      </div>
    </Editor>
  )
}