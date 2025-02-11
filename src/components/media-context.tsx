import { createContext, useContext, useState } from "react"

interface MediaContextProps {
  canvasElements: { id: string; type: string; x: number; y: number; width: number; height: number; url?: string }[]
  updateCanvasElement: (id: string, update: Partial<{ x: number; y: number; width: number; height: number }>) => void
}

const MediaContext = createContext<MediaContextProps | null>(null)

export const MediaProvider = ({ children }: { children: React.ReactNode }) => {
  const [canvasElements, setCanvasElements] = useState([
    { id: "1", type: "image", x: 10, y: 10, width: 200, height: 150, url: "/image.jpg" },
  ])

  const updateCanvasElement = (
    id: string,
    update: Partial<{ x: number; y: number; width: number; height: number }>,
  ) => {
    setCanvasElements((prev) => prev.map((element) => (element.id === id ? { ...element, ...update } : element)))
  }

  return <MediaContext.Provider value={{ canvasElements, updateCanvasElement }}>{children}</MediaContext.Provider>
}

export const useMedia = () => {
  const context = useContext(MediaContext)
  if (context === null) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}

