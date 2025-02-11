// lib/history-store.ts
import { create } from 'zustand';

interface HistoryState {
  history: Record<string, {
    stack: string[];
    index: number;
  }>;
  pushState: (nodeId: string, content: string) => void;
  undo: (nodeId: string) => string | null;
  redo: (nodeId: string) => string | null;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  history: {},
  pushState: (nodeId, content) => set((state) => {
    const nodeHistory = state.history[nodeId] || { stack: [content], index: 0 };
    if (nodeHistory.stack[nodeHistory.index] === content) return state;
    
    const newStack = [
      ...nodeHistory.stack.slice(0, nodeHistory.index + 1),
      content
    ];
    
    return {
      history: {
        ...state.history,
        [nodeId]: {
          stack: newStack,
          index: newStack.length - 1,
        },
      },
    };
  }),
  undo: (nodeId) => {
    let content = null;
    set((state) => {
      const nodeHistory = state.history[nodeId];
      if (!nodeHistory || nodeHistory.index <= 0) return state;
      
      const newIndex = nodeHistory.index - 1;
      content = nodeHistory.stack[newIndex];
      
      return {
        history: {
          ...state.history,
          [nodeId]: {
            ...nodeHistory,
            index: newIndex,
          },
        },
      };
    });
    return content;
  },
  redo: (nodeId) => {
    let content = null;
    set((state) => {
      const nodeHistory = state.history[nodeId];
      if (!nodeHistory || nodeHistory.index >= nodeHistory.stack.length - 1) return state;
      
      const newIndex = nodeHistory.index + 1;
      content = nodeHistory.stack[newIndex];
      
      return {
        history: {
          ...state.history,
          [nodeId]: {
            ...nodeHistory,
            index: newIndex,
          },
        },
      };
    });
    return content;
  },
}));