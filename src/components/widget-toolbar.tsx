"use client"

import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, HelpCircle, Bot, Play, ImageIcon, Type } from "lucide-react"
import { SliderComponent } from "@/components/user/slider"
import { QuizComponent } from "@/components/user/quiz"
import { AITutorComponent } from "@/components/user/ai-tutor"
import { TextComponent } from "@/components/user/text"

interface ToolbarProps {
  onVideoButtonClick: () => void;
  onImageButtonClick: () => void;
}

export function Toolbar({ onVideoButtonClick, onImageButtonClick }: ToolbarProps) {
  const { connectors } = useEditor()

  const handleVideoClick = () => {
    onVideoButtonClick()
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onImageButtonClick()
  }

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
      <Button onClick={handleVideoClick} variant="ghost" className="gap-2">
        <Play className="h-4 w-4" />
        Video
      </Button>
      <Button onClick={handleImageClick} variant="ghost" className="gap-2">
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