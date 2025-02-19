"use client"

import React, { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { 
  SlidersHorizontal, HelpCircle, Bot, Play, ImageIcon, Type, Move, Edit, MoveHorizontal 
} from "lucide-react";
import { SliderComponent } from "@/components/user/slider";
import { QuizComponent } from "@/components/user/quiz";
import { AITutorComponent } from "@/components/user/ai-tutor";
import { TextComponent } from "@/components/user/text";
import { useCursorMode, CursorMode } from "@/contexts/CursorModeContext";

interface ToolbarProps {
  onVideoButtonClick: () => void;
  onImageButtonClick: () => void;
}

export function Toolbar({ onVideoButtonClick, onImageButtonClick }: ToolbarProps) {
  const { connectors } = useEditor();
  const { cursorMode, setCursorMode } = useCursorMode();

  useEffect(() => {
    switch (cursorMode) {
      case "resize":
        document.body.style.cursor = "ew-resize";
        break;
      case "drag":
        document.body.style.cursor = "move";
        break;
      case "edit":
        document.body.style.cursor = "text";
        break;
      default:
        document.body.style.cursor = "default";
    }
  }, [cursorMode]);

  const handleVideoClick = () => onVideoButtonClick();

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onImageButtonClick();
  };

  return (
    <div className="flex justify-center p-2 relative bottom-0 bg-transparent left-0 right-0">
      <div className="flex h-12 items-center gap-1 rounded-full bg-transparent border shadow-sm px-4 mx-auto">
        {/* Cursor Mode Buttons */}
        <Button
          variant={cursorMode === "resize" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCursorMode(cursorMode === "resize" ? null : "resize")}
          className="rounded-full gap-2"
        >
          <MoveHorizontal className="h-4 w-4" />
          <span className="sr-only">Resize</span>
        </Button>
        <Button
          variant={cursorMode === "drag" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCursorMode(cursorMode === "drag" ? null : "drag")}
          className="rounded-full gap-2"
        >
          <Move className="h-4 w-4" />
          <span className="sr-only">Drag</span>
        </Button>
        <Button
          variant={cursorMode === "edit" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCursorMode(cursorMode === "edit" ? null : "edit")}
          className="rounded-full gap-2"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        <Button ref={(ref) => { connectors.create(ref!, <SliderComponent />); }} variant="ghost" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Slider
        </Button>
        <Button ref={(ref) => { connectors.create(ref!, <QuizComponent />); }} variant="ghost" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Quiz
        </Button>
        <Button ref={(ref) => { connectors.create(ref!, <AITutorComponent />); }} variant="ghost" className="gap-2">
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
        <Button ref={(ref) => { connectors.create(ref!, <TextComponent content="Sample Text" />); }} variant="ghost" className="gap-2">
          <Type className="h-4 w-4" />
          Text
        </Button>
      </div>
    </div>
  );
}