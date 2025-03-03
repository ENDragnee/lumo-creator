"use client"

import { useState, useEffect } from "react"
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

function DeserializeContent({ contentData }: { contentData: any }) {
  const { actions } = useEditor();

  useEffect(() => {
    if (contentData && actions) {
      try {
        console.log(contentData);
        actions.deserialize(contentData);
      } catch (error) {
        console.error("Error during deserialization:", error);
      }
    }
  }, [contentData, actions]);

  return null;
}

export default function TemplateEditor() {
  const { enabled } = useEditorStore()
  const searchParams = useSearchParams();
  const contentId = searchParams.get("contentId");
  const [contentData, setContentData] = useState(null);
  const [isVideoSectionVisible, setIsVideoSectionVisible] = useState(false)
  const [isImageSectionVisible, setIsImageSectionVisible] = useState(false)
  const [isSimulationSectionVisible, setIsSimulationSectionVisible] = useState(false)

  useEffect(() => {
    if (contentId) {
      fetch(`/api/drive?contentId=${contentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.content?.data) {
            try {
              // Parse the nested JSON string correctly
              const rawData = JSON.parse(data.content.data);
              const finalData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
              setContentData(finalData);
            } catch (error) {
              console.error("Parsing failed:", error);
            }
          }
        })
        .catch(console.error);
    }
  }, [contentId]);

  const handleVideoButtonClick = () => {
    setIsVideoSectionVisible((prev) => !prev)
  }

  const handleImageButtonClick = () => {
    setIsImageSectionVisible((prev) => !prev)
  }

  const handleSimulationButtonClick = () => {
    setIsSimulationSectionVisible((prev) => !prev)
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
      >
        <DeserializeContent contentData={contentData} />
        <div className="flex h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar 
              isVideoSectionVisible={isVideoSectionVisible} 
              isImageSectionVisible={isImageSectionVisible} 
              isSimulationSectionVisible={isSimulationSectionVisible}
            />
            <Frame>
              <Element is={renderCanvas} canvas>          
              </Element>
            </Frame>
          </div>
          <Toolbar 
            onVideoButtonClick={handleVideoButtonClick} 
            onImageButtonClick={handleImageButtonClick} 
            onSimulationButtonClick={handleSimulationButtonClick}
          />
        </div>
      </Editor>
    </CursorModeProvider>
  )
}
