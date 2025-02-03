"use client";

import { useState } from "react";
import { Editor, Frame, Element, useEditor, useNode } from "@craftjs/core";
import { TextWidget } from "@/components/widgets/text-widget";
import { SliderWidget } from "@/components/widgets/slider-widget";
import { QuizWidget } from "@/components/widgets/quiz-widget";
import { ContextMenu } from "@/components/ContextMenu/ContextMenu";
import useStore from "@/store/useStore";
import { Icons } from "@/components/ui/icons"; // Adjust the import path as necessary


// Create a generic Widget component wrapper for CraftJS
// Update your widget wrapper component
const WidgetWrapper = ({ children, id }: any) => {
  const { connectors: { connect, drag }, actions, selected } = useNode((node) => ({
    selected: node.events.selected
  }));

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`relative ${selected ? "border-2 border-ios-blue" : ""}`}
    >
      {children}
      
      {selected && (
        <button
          className="absolute -top-3 -right-3 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
          onClick={() => actions.setHidden(true)}
        >
          <Icons.x className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Create CraftJS components for each widget type
const CraftTextWidget = ({ content, ...props }: any) => {
  return (
    <WidgetWrapper>
      <TextWidget content={content} {...props} />
    </WidgetWrapper>
  );
};

const CraftSliderWidget = (props: any) => {
  return (
    <WidgetWrapper>
      <SliderWidget {...props} />
    </WidgetWrapper>
  );
};

const CraftQuizWidget = (props: any) => {
  return (
    <WidgetWrapper>
      <QuizWidget {...props} />
    </WidgetWrapper>
  );
};

export default function WorkspaceCanvas() {
  const { widgets, addWidget, updateWidget, removeWidget } = useStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id?: string } | null>(null);

  const handleEditorChange = (query: any) => {
    // Sync CraftJS state with your store
    const json = query.serialize();
    // You'll need to transform the CraftJS state to your widget format
    // This depends on your specific data structure needs
  };

  const handleContextMenu = (event: React.MouseEvent, id?: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id });
  };

  return (
    <div className="flex-1 p-4 bg-ios-light-gray overflow-auto">
      <Editor
        resolver={{
          CraftTextWidget,
          CraftSliderWidget,
          CraftQuizWidget,
          Element
        }}
        onNodesChange={handleEditorChange}
      >
        <Frame>
          <div
            className="w-full h-full bg-white rounded-lg shadow-md relative"
            style={{
              backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            onContextMenu={(e) => handleContextMenu(e)}
          >
            <Element
              is="div"
              canvas
              className="relative w-full h-full"
            >
              {widgets.map((widget) => (
                <Element
                  key={widget.id}
                  is={getWidgetComponentType(widget.type)}
                  id={widget.id}
                  custom={{ ...widget }}
                  canvas
                  style={{
                    left: `${widget.x}px`,
                    top: `${widget.y}px`,
                    width: `${widget.width}px`,
                    height: `${widget.height}px`,
                  }}
                />
              ))}
            </Element>
            
            {!widgets.length && (
              <div className="absolute inset-0 flex items-center justify-center text-ios-gray">
                Drag widgets here!
              </div>
            )}
          </div>
        </Frame>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            widgetId={contextMenu.id}
            onDelete={() => contextMenu.id && removeWidget(contextMenu.id)}
          />
        )}
      </Editor>
    </div>
  );
}

function getWidgetComponentType(type: string) {
  switch (type) {
    case "text": return CraftTextWidget;
    case "slider": return CraftSliderWidget;
    case "quiz": return CraftQuizWidget;
    default: return Element;
  }
}