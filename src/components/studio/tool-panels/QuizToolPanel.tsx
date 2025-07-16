"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
// FIX: Import the renamed component
import { TFQuizComponent } from "@/components/editor-components/TFQuizComponent"; 
import { TrueFalseQuestionComponent } from "@/components/editor-components/TrueFalseQuestionComponent";
import { ListChecks } from "lucide-react";

export function QuizToolPanel() { // You might want to rename this file to TFQuizToolPanel.tsx
  const { connectors } = useEditor();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-shrink-0 border-b">
        <h2 className="text-lg font-semibold">Quiz</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        <p className="text-sm text-muted-foreground mb-4">Drag a quiz preset onto the canvas.</p>
        <div
          ref={(ref: HTMLDivElement | null) => {
            if(ref){
              connectors.create(ref, 
                // FIX: Use the renamed component
                <TFQuizComponent title="New True/False Quiz">
                  <TrueFalseQuestionComponent 
                    questionText="Green chemistry aims to completely stop all chemical manufacturing."
                    correctAnswer={false}
                    explanation="Green chemistry seeks to make chemical manufacturing more sustainable and less hazardous, not to stop it entirely."
                  />
                  <TrueFalseQuestionComponent 
                    questionText="A reaction with 100% yield always has 100% atom economy."
                    correctAnswer={false}
                    explanation="Yield measures product obtained vs. theoretical max. Atom economy measures how many reactant atoms end up in the desired product vs. byproducts."
                  />
                </TFQuizComponent>
              )
            }
          }}
          className="cursor-grab p-4 border rounded-lg bg-card hover:bg-muted transition-colors flex items-center gap-4"
        >
          <ListChecks className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold">True/False Quiz</h3>
          </div>
        </div>
      </div>
    </div>
  );
}