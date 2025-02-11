import { create } from "zustand"

interface EditorStore {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  enabled: true,
  setEnabled: (enabled) => set({ enabled }),
}))

