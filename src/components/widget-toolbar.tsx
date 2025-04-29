"use client";

import React, { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import {
  SlidersHorizontal,
  HelpCircle,
  Play,
  ImageIcon,
  Type,
  Move,
  Edit,
  MoveHorizontal,
  Monitor,
} from "lucide-react";
import { SliderComponent } from "@/components/user/slider";
import { QuizComponent } from "@/components/user/quiz";
import { TextComponent } from "@/components/user/text";
// import { useCursorMode } from "@/contexts/CursorModeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

interface ToolbarProps {
  onVideoButtonClick: () => void;
  onImageButtonClick: () => void;
  onSimulationButtonClick: () => void;
}

export function Toolbar({
  onVideoButtonClick,
  onImageButtonClick,
  onSimulationButtonClick,
}: ToolbarProps) {
  const { connectors } = useEditor();
  // const { cursorMode, setCursorMode } = useCursorMode();
  const { theme } = useTheme();

  // useEffect(() => {
  //   // Update the body cursor based on the current mode
  //   switch (cursorMode) {
  //     case "resize":
  //       document.body.style.cursor = "ew-resize";
  //       break;
  //     case "drag":
  //       document.body.style.cursor = "move";
  //       break;
  //     case "edit":
  //       document.body.style.cursor = "text";
  //       break;
  //     default:
  //       document.body.style.cursor = "default";
  //   }
  // }, [cursorMode]);

  const handleVideoClick = () => onVideoButtonClick();
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onImageButtonClick();
  };
  const handleSimulationClick = () => {
    onSimulationButtonClick();
  };

  return (
    // Use the data-theme attribute to drive custom styles
    <div
      data-theme={theme === "dark" ? "arc-dark" : "light"}
      className="flex justify-center items-center p-2 relative bottom-0 bg-card left-1/4 right-0 transition-all duration-300 ease-in-out animate-slideIn w-1/2"
    >
      <div className="flex h-12 items-center gap-1 rounded-full bg-gray-100 dark:bg-[#383c4a] border-gray-100 shadow-sm px-4 mx-auto transition-all duration-300 ease-in-out">
        {/* Cursor Mode Buttons */}
        {/* <Button
          variant={cursorMode === "resize" ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            setCursorMode(cursorMode === "resize" ? null : "resize")
          }
          className="rounded-full gap-2 transform transition duration-300 ease-in-out hover:scale-105 text-toolbar-accent hover:text-toolbar-accent-hover"
        >
          <MoveHorizontal className="h-4 w-4" />
          <span className="sr-only">Resize</span>
        </Button>
        <Button
          variant={cursorMode === "drag" ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            setCursorMode(cursorMode === "drag" ? null : "drag")
          }
          className="rounded-full gap-2 transform transition duration-300 ease-in-out hover:scale-105 text-toolbar-accent hover:text-toolbar-accent-hover"
        >
          <Move className="h-4 w-4" />
          <span className="sr-only">Drag</span>
        </Button>
        <Button
          variant={cursorMode === "edit" ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            setCursorMode(cursorMode === "edit" ? null : "edit")
          }
          className="rounded-full gap-2 transform transition duration-300 ease-in-out hover:scale-105 text-toolbar-accent hover:text-toolbar-accent-hover"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>

        <div className="h-6 w-px bg-border mx-2" /> */}

        <Button
          ref={(ref) => {
            connectors.create(ref!, <SliderComponent />);
          }}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Slider
        </Button>
        <Button
          ref={(ref) => {
            connectors.create(ref!, <QuizComponent />);
          }}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <HelpCircle className="h-4 w-4" />
          Quiz
        </Button>
        <Button
          onClick={handleSimulationClick}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <Monitor className="h-4 w-4" />
          Simulation
        </Button>
        <Button
          onClick={handleVideoClick}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <Play className="h-4 w-4" />
          Video
        </Button>
        <Button
          onClick={handleImageClick}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </Button>
        <Button
          ref={(ref) => {
            connectors.create(ref!, <TextComponent content="Sample Text" />);
          }}
          variant="ghost"
          className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 rounded-3xl"
        >
          <Type className="h-4 w-4" />
          Text
        </Button>
      </div>
    </div>
  );
}
