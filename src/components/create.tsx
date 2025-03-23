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
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (!contentId) return;
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

  const debouncedSave = useDebounce(saveContent, 2000)

  const handleToolChange = (toolType: string) => {
    setActiveTool(prevTool => prevTool === toolType ? null : toolType);
  }

  function DeserializeContent({ contentData }: { contentData: string | null }) {
    const { actions } = useEditor();

    useEffect(() => {
      if (contentData && actions && !isInitialized) {
        try {
          console.log("Deserializing content:", contentData);
          actions.deserialize(contentData);
          setIsInitialized(true);
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
      if (contentId && isInitialized) {
        console.log("Auto-saving editor state");
        debouncedSave(json);
      }
    }, [json]);
    
    return null;
  }

  return (
    <CursorModeProvider>
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
            <MemoizedCanvas />
          </div>
          <Toolbar 
            onVideoButtonClick={() => handleToolChange('video')}
            onImageButtonClick={() => handleToolChange('image')}
            onSimulationButtonClick={() => handleToolChange('simulation')}
          />
        </div>
      </Editor>
    </CursorModeProvider>
  )
}