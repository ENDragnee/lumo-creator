// @/components/Toolbar.tsx

"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, HelpCircle, Play, ImageIcon, Type, Monitor, Layout } from "lucide-react";
import { SliderComponent } from "@/components/editor-components/SliderComponent"; // Assuming new path
import { QuizComponent } from "@/components/editor-components/QuizComponent"; // Assuming new path
import { setActiveTool, ToolType } from "@/app/store/slices/editorSlice";
import { AppDispatch } from "@/app/store/store";

export function Toolbar() {
  const { connectors } = useEditor();
  const dispatch = useDispatch<AppDispatch>();

  // This handler dispatches the action that triggers the sidebar to open.
  const handleToolClick = (tool: ToolType) => {
    dispatch(setActiveTool(tool));
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div
        className="flex justify-center items-center p-1 bg-card border rounded-full shadow-lg transition-all duration-300 ease-in-out"
        >
            <div className="flex h-12 items-center gap-1">
                {/* Components that can be dragged directly */}
                <Button
                    onClick={() => handleToolClick('container')}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <Layout className="h-4 w-4" />
                    <span className="hidden md:inline">Layout</span>
                </Button>
                <Button
                    ref={(ref: HTMLButtonElement | null) => { 
                      if(ref){
                        connectors.create(ref, <SliderComponent />)
                    }}}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden md:inline">Slider</span>
                </Button>
                <Button
                    ref={(ref: HTMLButtonElement | null) => {
                      if(ref){
                        connectors.create(ref, <QuizComponent />)
                      }}}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden md:inline">Quiz</span>
                </Button>

                <div className="h-6 w-px bg-border mx-2" />

                {/* Components that open the right sidebar */}
                <Button
                    onClick={() => handleToolClick('simulation')}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <Monitor className="h-4 w-4" />
                    <span className="hidden md:inline">Simulation</span>
                </Button>
                <Button
                    onClick={() => handleToolClick('video')}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <Play className="h-4 w-4" />
                    <span className="hidden md:inline">Video</span>
                </Button>
                <Button
                    onClick={() => handleToolClick('image')}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden md:inline">Image</span>
                </Button>
                <Button
                    onClick={() => handleToolClick('text')}
                    variant="ghost"
                    className="gap-2 transform transition duration-300 ease-in-out hover:scale-105 rounded-full"
                >
                    <Type className="h-4 w-4" />
                    <span className="hidden md:inline">Text</span>
                </Button>
            </div>
        </div>
    </div>
  );
}
