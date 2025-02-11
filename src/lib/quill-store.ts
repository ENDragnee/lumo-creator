import { create } from 'zustand'

interface QuillStore {
  activeQuill: any | null
  setActiveQuill: (quill: any) => void
}

export const useQuillStore = create<QuillStore>((set) => ({
  activeQuill: null,
  setActiveQuill: (quill) => set({ activeQuill: quill }),
}))