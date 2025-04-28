"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Editor, Frame, Element, useEditor } from "@craftjs/core"
import { Sidebar } from "@/components/sidebar"
import { renderCanvas } from "@/components/canvas"
import { Navbar } from "@/components/navbar"
import { Toolbar } from "@/components/widget-toolbar"
import { ImageComponent } from "@/components/user/image"
import { TextComponent } from "@/components/user/text"
import { VideoComponent } from "@/components/user/video"
import { SimulationComponent } from "@/components/user/simulation"
import { QuizComponent } from "@/components/user/quiz"
import { SliderComponent } from "@/components/user/slider"
import { AITutorComponent } from "@/components/user/ai-tutor"
import { useEditorStore } from "@/lib/editor-store"
import { CursorModeProvider } from "@/contexts/CursorModeContext"
import { useSearchParams } from "next/navigation";

interface DebounceCallback {
  (...args: any[]): void;
}

function useDebounce(callback: DebounceCallback, delay: number): (...args: any[]) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

const MemoizedCanvas = memo(({ children }: { children?: React.ReactNode }) => {
  return (
    <Frame>
      <Element is={renderCanvas} canvas>
        {children}
      </Element>
    </Frame>
  );
});

MemoizedCanvas.displayName = 'MemoizedCanvas';

export default function TemplateEditor() {
  const { enabled } = useEditorStore()
  const searchParams = useSearchParams();
  const contentId = searchParams.get("contentId");
  const [contentData, setContentData] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const deserializedRef = useRef(false);

  useEffect(() => {
    if (contentId) {
      fetch(`/api/drive?contentId=${contentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.content?.data) {
            setContentData(data.content.data);
          }
        })
        .catch(console.error);
    }
  }, [contentId]);

  interface SaveContentParams {
    contentId: string;
    data: string;
  }

  const saveContent = async (json: string): Promise<void> => {
    console.log("saveContent called with JSON:", json); // Debugging
    if (!contentId) {
      console.warn("No contentId provided, skipping save.");
      return;
    }
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, data: json } as SaveContentParams),
      });
      if (!response.ok) {
        console.error("Failed to update content");
      } else {
        console.log("Content updated successfully");
      }
    } catch (error) {
      console.error("Error updating content:", error);
    }
  };

  const debouncedSave = useCallback(
    useDebounce((json: string) => {
      console.log("debouncedSave called with JSON:", json); // Debugging
      saveContent(json);
    }, 2000),
    [contentId] // Add contentId as a dependency to recreate the function when it changes
  );

  const handleToolChange = (toolType: string) => {
    setActiveTool(prevTool => prevTool === toolType ? null : toolType);
  }

  function DeserializeContent({ contentData }: { contentData: string | null }) {
    const { actions } = useEditor();

    useEffect(() => {
      if (contentData && actions && !deserializedRef.current) {
        try {
          console.log("Deserializing content:", contentData);
          actions.deserialize(contentData);
          deserializedRef.current = true;
        } catch (error) {
          console.error("Error during deserialization:", error);
        }
      }
    }, [contentData, actions]);

    return null;
  }

  function EditorDataHandler() {
    const { json } = useEditor((state, query) => ({ json: query.serialize() }));

    useEffect(() => {
      console.log("Editor JSON updated:", json); // Debugging JSON updates
      
      // Only save if we have a contentId and deserialization has completed
      if (contentId && deserializedRef.current) {
        console.log("Auto-saving editor state");
        debouncedSave(json);
      } else {
        console.log("Autosave conditions not met - contentId:", contentId, "deserialized:", deserializedRef.current);
      }
    }, [json, contentId, debouncedSave]); 

    return null;
  }

  return (
      <Editor
        resolver={{
          renderCanvas,
          Image: ImageComponent,
          Text: TextComponent,
          Video: VideoComponent,
          Simulation: SimulationComponent,
          Quiz: QuizComponent,
          Slider: SliderComponent,
          AITutor: AITutorComponent,
        }}
        enabled={enabled}
        onNodesChange={() => {
          // This ensures we don't lose state on sidebar changes
          // by explicitly handling node changes
        }}
      >
        <DeserializeContent contentData={contentData} />
        <EditorDataHandler />
        
        <div className="flex h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar activeTool={activeTool} />
            <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden">
              <MemoizedCanvas />
              <Toolbar
                onVideoButtonClick={() => handleToolChange('video')}
                onImageButtonClick={() => handleToolChange('image')}
                onSimulationButtonClick={() => handleToolChange('simulation')}
              />
            </div>
          </div>
        </div>
      </Editor>
  )
}