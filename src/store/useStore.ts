import { create } from "zustand"

interface Widget {
  id: string
  type: "text" | "slider" | "quiz"
  x: number
  y: number
  width: number
  height: number
  [key: string]: any
}

interface StoreState {
  widgets: Widget[]
  addWidget: (widget: Widget) => void
  updateWidget: (id: string, data: Partial<Widget>) => void
  removeWidget: (id: string) => void
}

const useStore = create<StoreState>((set) => ({
  widgets: [],
  addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),
  updateWidget: (id, data) =>
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...data } : w)),
    })),
  removeWidget: (id) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    })),
}))

export default useStore

