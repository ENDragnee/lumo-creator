"use client"
import { TopNavigationBar } from "@/components/top-navigation-bar"
import { WidgetToolbar } from "@/components/widget-toolbar"
import { PropertiesPanel } from "@/components/properties-panel"
import { BottomToolbar } from "@/components/bottom-toolbar"
import { FloatingAIAssistant } from "@/components/floating-ai-assistant"
import { Frame, Element } from "@craftjs/core"
import dynamic from "next/dynamic"
import { editorResolver } from "@/types/resolver"
// Disable SSR for the Editor
const NoSSREditor = dynamic(
  () => import("@craftjs/core").then((mod) => mod.Editor),
  { ssr: false }
);

// Create a wrapper component for the Canvas
const CraftJSCanvas = () => {
  return (
    <div className="flex-1 overflow-hidden relative">
      {/* <Editor></Editor> */}
      <Frame>
        <Element
          id="root"
          is="div"
          canvas
          className="w-full h-full bg-white rounded-lg shadow-md relative"
          style={{
            backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* Your canvas content will be rendered here */}
        </Element>
      </Frame>
    </div>
  );
};

export default function EducationalStudio() {
  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7] font-sans">
      
        <NoSSREditor
          resolver={
            editorResolver
          }
          enabled={true}
        >
          <TopNavigationBar />
          <div className="flex-1 flex overflow-hidden">
          <WidgetToolbar />
          <CraftJSCanvas />
          <PropertiesPanel />
        </div>
        </NoSSREditor>

      <BottomToolbar />
      <FloatingAIAssistant />
    </div>
  );
}
