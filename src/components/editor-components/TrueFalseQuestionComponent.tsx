"use client";

import React, { useContext, useEffect, useState } from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { TrueFalseQuestionSettings } from './settings/TrueFalseQuestionSettings';
import { TFQuizContext } from './TFQuizComponent'; 
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Props Interface ---
export interface TrueFalseQuestionProps {
  questionText?: string;
  correctAnswer?: boolean;
  explanation?: string;
}

// --- Craftable Component Definition ---
type CraftableTrueFalseQuestionComponent = UserComponent<TrueFalseQuestionProps>;

export const TrueFalseQuestionComponent: CraftableTrueFalseQuestionComponent = ({
  questionText = "Is this statement true or false?",
  correctAnswer = true,
  explanation = "This is the explanation for the correct answer.",
}) => {
  // FIX: Destructure connectors at the top of the component
  const { id, connectors: { connect } } = useNode();
  const quizContext = useContext(TFQuizContext);
  const [userSelection, setUserSelection] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (quizContext) {
      quizContext.registerQuestion(id, { correctAnswer });
    }
  }, [id, correctAnswer, quizContext]);

  useEffect(() => {
    if (quizContext && !quizContext.isSubmitted) {
      setUserSelection(null);
    }
  }, [quizContext?.isSubmitted]);

  const handleSelect = (selection: boolean) => {
    if (quizContext?.isSubmitted) return;
    setUserSelection(selection);
  };

  const isCorrect = userSelection === correctAnswer;
  const showFeedback = quizContext?.isSubmitted && userSelection !== null;

  return (
    <div
      // FIX: Use the standard ref callback pattern to apply the connector
      ref={(refValue: HTMLDivElement | null) => {
        if (refValue) {
          connect(refValue);
        }
      }}
      className={cn(
        "p-4 rounded-lg border transition-all",
        showFeedback && isCorrect && "bg-green-500/10 border-green-500",
        showFeedback && !isCorrect && "bg-red-500/10 border-red-500"
      )}
    >
      <p className="mb-3">{questionText}</p>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleSelect(true)}
          disabled={quizContext?.isSubmitted}
          variant={userSelection === true ? 'default' : 'outline'}
          size="sm"
        >
          True
        </Button>
        <Button
          onClick={() => handleSelect(false)}
          disabled={quizContext?.isSubmitted}
          variant={userSelection === false ? 'destructive' : 'outline'}
          size="sm"
        >
          False
        </Button>
      </div>
      {showFeedback && (
        <div className="mt-3 text-sm">
          {isCorrect ? (
            <p className="text-green-600 font-medium">Correct!</p>
          ) : (
            <p className="text-red-600">
              <span className="font-bold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

TrueFalseQuestionComponent.craft = {
  displayName: "True/False Question",
  isCanvas: false,
  props: {
    questionText: "The sky is blue.",
    correctAnswer: true,
    explanation: "Due to Rayleigh scattering, blue light is scattered more than other colors.",
  },
  related: {
    settings: TrueFalseQuestionSettings,
  },
};