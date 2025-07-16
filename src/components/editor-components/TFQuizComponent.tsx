"use client";

import React, { useState, createContext, useCallback } from 'react';
import { useEditor, useNode, UserComponent } from '@craftjs/core';
import { TFQuizSettings } from './settings/TFQuizSettings'; 
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { TrueFalseQuestionComponent } from './TrueFalseQuestionComponent'; // Ensure this is imported for the rule type check

// --- Context Definition ---
interface QuestionInfo { correctAnswer: boolean; }
interface TFQuizContextType {
  isSubmitted: boolean;
  registerQuestion: (id: string, info: QuestionInfo) => void;
}
export const TFQuizContext = createContext<TFQuizContextType | null>(null);

// --- Props Interface ---
export interface TFQuizProps {
  title?: string;
  children?: React.ReactNode;
}

// --- Craftable Component Definition ---
type CraftableTFQuizComponent = UserComponent<TFQuizProps>;

export const TFQuizComponent: CraftableTFQuizComponent = ({
  title = "Knowledge Check",
  children
}) => {
  const { connectors: { connect, drag }, id } = useNode();
  const { selected, actions: editorActions, enabled: editorEnabled } = useEditor((state, query) => ({
    selected: query.getEvent('selected').contains(id) || query.node(id).descendants().some(nodeId => query.getEvent('selected').contains(nodeId)),
    enabled: state.options.enabled
  }));

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questions, setQuestions] = useState<Record<string, QuestionInfo>>({});

  const registerQuestion = useCallback((id: string, info: QuestionInfo) => {
    setQuestions(prev => ({ ...prev, [id]: info }));
  }, []);
  
  const handleReset = () => setIsSubmitted(false);
  const handleCheck = () => setIsSubmitted(true);
  
  const contextValue = { isSubmitted, registerQuestion };

  return (
    <TFQuizContext.Provider value={contextValue}>
      <div
        ref={(ref: HTMLDivElement | null) => { if (ref) connect(drag(ref)); }}
        className="relative w-full p-6 rounded-lg bg-slate-800 text-white"
      >
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="space-y-6">
          {children}
          {React.Children.count(children) === 0 && editorEnabled && (
             <div className="flex items-center justify-center min-h-[100px] border-2 border-dashed border-slate-600 rounded-md">
                <p className="text-slate-400 text-sm">Add questions from the settings panel</p>
             </div>
          )}
        </div>
        <div className="mt-8 flex justify-end gap-2">
          <Button onClick={handleCheck} disabled={isSubmitted}>Check All</Button>
          <Button onClick={handleReset} variant="secondary">Reset</Button>
        </div>
        {selected && editorEnabled && (
          <Button
            variant="destructive" size="icon"
            className="absolute top-2 right-2 z-10 h-6 w-6"
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onClick={() => editorActions.delete(id)}
          ><Trash2 className="h-3 w-3" /></Button>
        )}
      </div>
    </TFQuizContext.Provider>
  );
};

TFQuizComponent.craft = {
  displayName: "T/F Quiz",
  isCanvas: true,
  props: {
    title: "Principle Check: True or False?",
  },
  related: {
    settings: TFQuizSettings,
  },
  rules: {
    // FIX: Corrected query.node(node.id).get()
    canMoveIn: (incoming, self, query) => {
      return incoming.every(node => query(node.id).get().data.displayName === 'True/False Question');
    }
  }
};