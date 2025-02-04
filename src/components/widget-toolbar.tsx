"use client"
import { useState, useRef, useEffect } from "react"
import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { CraftTextWidget } from "@/components/widgets/text-widget"
import { CraftSliderWidget } from "@/components/widgets/slider-widget"
import { CraftQuizWidget } from "@/components/widgets/quiz-widget"
import { CraftImageWidget } from "@/components/widgets/image-widget"
import { CraftVideoWidget } from "@/components/widgets/video-widget"

const categories = [
  {
    name: "Basics",
    widgets: [
      { icon: Icons.text, label: "Text Box", component: <CraftTextWidget content="New Text" textType={"body"} /> },
      { icon: Icons.image, label: "Image", component: <CraftImageWidget /> }, // Create ImageWidget component
      { icon: Icons.video, label: "Video", component: <CraftVideoWidget /> }, // Create VideoWidget component
    ],
  },
  {
    name: "Interactive",
    widgets: [
      // { icon: Icons.slider, label: "Slider", component: <CraftSliderWidget min={0} max={100} step={1} defaultValue={50} /> },
      { 
        icon: Icons.quiz, 
        label: "Quiz", 
        component: <CraftQuizWidget 
                      question="Sample Question?" 
                      options={["Option 1", "Option 2", "Option 3", "Option 4"]} 
                      correctAnswer={1} 
                    /> 
      },
      { icon: Icons.simulation, label: "Simulation", component: <div>Simulation Widget</div> },
    ],
  },
  // {
  //   name: "Advanced",
  //   widgets: [
  //     { icon: Icons.aiTutor, label: "AI Tutor", component: <div>AITutor Widget</div> },
  //     { icon: Icons.progressTracker, label: "Progress Tracker", component: <div>ProgressTracker Widget</div> },
  //   ],
  // },
]

export function WidgetToolbar() {
  const { connectors } = useEditor()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      widgets: category.widgets.filter((widget) => widget.label.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((category) => category.widgets.length > 0)

  return (
    <div
      className={cn(
        "bg-white border-r border-[#E5E5EA] flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className="p-3">
        {isCollapsed ? (
          <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setIsCollapsed(false)}>
            <Icons.search className="h-5 w-5 text-[#8E8E93]" />
          </Button>
        ) : (
          <div className="relative">
            <Icons.search className="absolute left-3 top-2.5 h-5 w-5 text-[#8E8E93]" />
            <Input
              ref={searchInputRef}
              placeholder="Search widgets..."
              className="pl-10 pr-8 h-10 bg-[#F5F5F7] border-[#E5E5EA] rounded-lg focus:border-[#007AFF] focus:ring focus:ring-[#007AFF]/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-[#8E8E93]"
                onClick={() => setSearchQuery("")}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {filteredCategories.map((category, index) => (
            <div key={index} className="space-y-2">
              {!isCollapsed && <h3 className="text-xs font-semibold text-[#8E8E93] px-2">{category.name}</h3>}
              <div className="space-y-1">
                {category.widgets.map((widget, widgetIndex) => (
                  <WidgetButton
                    key={widgetIndex}
                    icon={widget.icon}
                    label={widget.label}
                    isCollapsed={isCollapsed}
                    component={widget.component}
                    connector={connectors.create}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="m-3">
        <Icons.chevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
    </div>
  )
}

function WidgetButton({
  icon: Icon,
  label,
  isCollapsed,
  component,
  connector
}: {
  icon: any
  label: string
  isCollapsed: boolean
  component: React.ReactElement
  connector: any
}) {
  return (
    <div
      ref={(ref) => ref && connector(ref, component)}
      className={cn(
        "w-full justify-start text-[#000000] opacity-80 hover:bg-[#F5F5F7] hover:text-[#007AFF] focus:ring-2 focus:ring-[#007AFF] transition-all",
        isCollapsed ? "px-3" : "px-2",
        "cursor-move" // Add cursor-move indicator
      )}
      role="listitem"
      aria-label={`Add ${label} widget`}
    >
      <Button
        variant="ghost"
        className="w-full h-full justify-start"
        asChild
      >
        <div>
          <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>{label}</span>}
        </div>
      </Button>
    </div>
  )
}