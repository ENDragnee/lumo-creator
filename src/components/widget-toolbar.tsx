"use client"

import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, HelpCircle, Bot, Play, ImageIcon, Type } from "lucide-react"
import { SliderComponent } from "@/components/user/slider"
import { QuizComponent } from "@/components/user/quiz"
import { AITutorComponent } from "@/components/user/ai-tutor"
import { VideoComponent } from "@/components/user/video"
import { ImageComponent } from "@/components/user/image"
import { TextComponent } from "@/components/user/text"

export function Toolbar() {
  const { connectors } = useEditor()

  return (
    <div className="flex h-16 items-center gap-2 border-t bg-background px-6">
      <Button ref={(ref) => { connectors.create(ref!, <SliderComponent />) }} variant="ghost" className="gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Slider
      </Button>
      <Button ref={(ref) => {connectors.create(ref!, <QuizComponent />)}} variant="ghost" className="gap-2">
        <HelpCircle className="h-4 w-4" />
        Quiz
      </Button>
      <Button ref={(ref) => {connectors.create(ref!, <AITutorComponent />)}} variant="ghost" className="gap-2">
        <Bot className="h-4 w-4" />
        AI Tutor
      </Button>
      <Button ref={(ref) => {connectors.create(ref!, <VideoComponent />)}} variant="ghost" className="gap-2">
        <Play className="h-4 w-4" />
        Video
      </Button>
      <Button ref={(ref) => {connectors.create(ref!, <ImageComponent />)}} variant="ghost" className="gap-2">
        <ImageIcon className="h-4 w-4" />
        Image
      </Button>
      <Button ref={(ref) => {connectors.create(ref!, <TextComponent content="Sample Text" />)}} variant="ghost" className="gap-2">
        <Type className="h-4 w-4" />
        Text
      </Button>
    </div>
  )
}

