"use client";

import React, { ReactNode, useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import {
  LayoutDashboard,
  MousePointerClick,
  Type,
  GalleryHorizontal,
  Square,
  SlidersHorizontal,
  Play,
  ImageIcon,
  HelpCircle,
  Monitor,
  Layers3,
  Info,
  FlipVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Redux Imports ---
// FIX: Corrected the typo in the import path from "toolbatSlice" to "toolbarSlice"
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setLockedOpen } from "@/app/store/slices/toolbarSlice";

// --- Component Imports & Placeholders ---
type ContainerProps = { children?: ReactNode; padding?: number };
const Container = ({ children, padding = 20 }: ContainerProps) => (
  <div style={{ padding: `${padding}px`, border: '1px dashed #ddd', minHeight: '50px' }}>
    {children}
  </div>
);

import { SliderComponent } from "@/components/editor-components/SliderComponent";
import { QuizComponent } from "@/components/editor-components/QuizComponent";

const createPlaceholder = (name: string) => () => (
    <div className="p-4 border border-dashed text-center text-muted-foreground">
        <p>{name} Component</p>
    </div>
);
const TabsComponent = createPlaceholder("Tabs");
const CalloutComponent = createPlaceholder("Callout/Info Box");
const FlashcardComponent = createPlaceholder("Flashcard");


// --- Reusable Draggable Tool Button ---
type DraggableToolButtonProps = {
  name: string;
  icon: React.ReactNode;
  component: React.ReactElement;
};
const DraggableToolButton = ({ name, icon, component }: DraggableToolButtonProps) => {
  const { connectors } = useEditor();
  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connectors.create(ref, component);
      }}
      className="flex flex-col items-center justify-center p-2 rounded-lg cursor-grab hover:bg-accent transition-colors text-center w-24"
    >
      {icon}
      <span className="text-xs mt-1">{name}</span>
    </div>
  );
};


// --- The Main Toolbar Component ---
export function Toolbar() {
  const dispatch = useAppDispatch();
  // This selector will now work correctly
  const isLocked = useAppSelector((state) => state.toolbar.isLockedOpen);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isHovered || isLocked;

  const handlePopoverOpenChange = (isOpen: boolean) => {
    // This dispatch will now work correctly
    dispatch(setLockedOpen(isOpen));
  };

  const toolCategories = [
    { name: "Layout", icon: <LayoutDashboard className="h-5 w-5" />, tools: [ { name: "Container", icon: <Square className="h-5 w-5" />, component: <Element is={Container} padding={20} canvas /> }, { name: "Tabs", icon: <Layers3 className="h-5 w-5" />, component: <TabsComponent /> }, ], },
    { name: "Media", icon: <GalleryHorizontal className="h-5 w-5" />, tools: [ { name: "Carousel", icon: <SlidersHorizontal className="h-5 w-5" />, component: <SliderComponent /> }, { name: "Image", icon: <ImageIcon className="h-5 w-5" />, component: <p>Image</p> }, { name: "Video", icon: <Play className="h-5 w-5" />, component: <p>Video</p> }, ], },
    { name: "Interactive", icon: <MousePointerClick className="h-5 w-5" />, tools: [ { name: "MCQ Quiz", icon: <HelpCircle className="h-5 w-5" />, component: <QuizComponent /> }, { name: "Flashcard", icon: <FlipVertical className="h-5 w-5" />, component: <FlashcardComponent /> }, { name: "Simulation", icon: <Monitor className="h-5 w-5" />, component: <p>Sim</p> }, ], },
    { name: "Content", icon: <Type className="h-5 w-5" />, tools: [ { name: "Text", icon: <Type className="h-5 w-5" />, component: <p>Text</p> }, { name: "Callout Box", icon: <Info className="h-5 w-5" />, component: <CalloutComponent /> }, ], },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center p-4">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn( "flex items-center p-1 bg-card border rounded-full shadow-lg transition-all duration-300 ease-in-out", isExpanded && "p-2 gap-1" )}
        >
          {toolCategories.map((category) => (
            <Popover key={category.name} onOpenChange={handlePopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        // Base styles: transition max-width, set fixed height, and clip overflow.
                        "flex items-center justify-center rounded-full h-10 p-0 overflow-hidden transition-all duration-300 ease-in-out",
                        // Collapsed state: Constrain the width with max-width.
                        "max-w-10", 
                        // Expanded state: Set a large max-width to allow smooth expansion, and adjust height/padding.
                        isExpanded && "max-w-40 h-12 px-4" 
                    )}
                    >
                  {category.icon}
                  <span
                    className={cn( "ml-2 whitespace-nowrap text-sm font-medium transform-gpu transition-transform transition-opacity duration-200 ease-in-out", isExpanded ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 origin-left" )}
                  >
                    {category.name}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 mb-2" side="top" align="center">
                <div className="grid grid-cols-2 gap-2">
                  {category.tools.map((tool) => (
                    <DraggableToolButton
                      key={tool.name}
                      name={tool.name}
                      icon={tool.icon}
                      component={tool.component}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </div>
  );
}