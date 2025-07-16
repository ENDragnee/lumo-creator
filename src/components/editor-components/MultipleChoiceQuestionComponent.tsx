"use client";

import React, { useState, useCallback } from 'react';
import { useEditor, useNode, UserComponent } from '@craftjs/core';
import { MultipleChoiceQuestionSettings } from './settings/MultipleChoiceQuestionSettings';
import { Button as UiButton } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';

// --- Type for a single answer option ---
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

// --- Props Interface ---
export interface MultipleChoiceQuestionProps {
  title?: string;
  prompt?: string;
  instruction?: string;
  allowMultipleAnswers?: boolean;
  options?: QuestionOption[];
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
  buttonText?: string;
}

// --- Craftable Component Definition ---
type CraftableMultipleChoiceQuestionComponent = UserComponent<MultipleChoiceQuestionProps>;

export const MultipleChoiceQuestionComponent: CraftableMultipleChoiceQuestionComponent = ({
  title = "Question 1 of 1",
  prompt = "This is the question prompt. You can edit it in the settings.",
  instruction = "Select the correct answer(s), then submit.",
  allowMultipleAnswers = true,
  options = [
    { text: "Correct Answer", isCorrect: true },
    { text: "Incorrect Answer", isCorrect: false },
  ],
  feedbackCorrect = "That's right! Well done.",
  feedbackIncorrect = "Not quite. Review the correct answers highlighted above.",
  buttonText = "Submit"
}) => {
  const { id, connectors: { connect, drag } } = useNode();
  const { selected, actions: editorActions, enabled: editorEnabled } = useEditor((state, query) => ({
    selected: query.getEvent('selected').contains(id),
    enabled: state.options.enabled,
  }));

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [submission, setSubmission] = useState<{ state: 'idle' | 'submitted'; isCorrect?: boolean }>( { state: 'idle' } );

  const handleSelectionChange = (index: number) => {
    if (submission.state === 'submitted') return;

    setSelectedIndices(prev => {
      const newSelection = new Set(prev);
      if (allowMultipleAnswers) {
        if (newSelection.has(index)) newSelection.delete(index);
        else newSelection.add(index);
      } else {
        newSelection.clear();
        newSelection.add(index);
      }
      return newSelection;
    });
  };

  const handleSubmit = () => {
    if (editorEnabled) return;
    
    const correctIndices = new Set(
      options.map((opt, i) => (opt.isCorrect ? i : -1)).filter(i => i !== -1)
    );

    const isCorrect = selectedIndices.size === correctIndices.size &&
                      [...selectedIndices].every(index => correctIndices.has(index));

    setSubmission({ state: 'submitted', isCorrect });
  };
  
  const handleReset = () => {
      setSelectedIndices(new Set());
      setSubmission({ state: 'idle' });
  }

  const getOptionState = (index: number, option: QuestionOption) => {
    if (submission.state !== 'submitted') return selectedIndices.has(index) ? 'selected' : 'default';
    const isSelected = selectedIndices.has(index);
    if (option.isCorrect) return 'correct';
    if (isSelected && !option.isCorrect) return 'incorrect';
    return 'default';
  }

  return (
    <div ref={(ref: HTMLDivElement | null) => { if (ref) connect(drag(ref)); }} className="relative w-full p-4">
      <div className="space-y-4">
        <ReactMarkdown className="text-2xl font-bold">{title}</ReactMarkdown>
        <ReactMarkdown className="prose prose-sm sm:prose-base max-w-none">{prompt}</ReactMarkdown>
        <p className="text-sm font-semibold">{instruction}</p>

        <div className="space-y-3">
          {options.map((option, index) => {
            const optionState = getOptionState(index, option);
            return (
                <Label 
                    key={index} 
                    onClick={() => handleSelectionChange(index)}
                    className={cn("flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer", {
                      "border-primary bg-primary/10": optionState === 'selected',
                      "border-green-500 bg-green-500/10": optionState === 'correct',
                      "border-red-500 bg-red-500/10": optionState === 'incorrect',
                      "border-border bg-muted/50 hover:bg-muted/80": optionState === 'default',
                    })}
                >
                    <Checkbox checked={selectedIndices.has(index)} className="h-5 w-5" />
                    <span>{option.text}</span>
                </Label>
            )
          })}
        </div>

        {submission.state === 'submitted' ? (
             <div className="p-4 rounded-lg text-center space-y-4" style={{ backgroundColor: submission.isCorrect ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)'}}>
                <p>{submission.isCorrect ? feedbackCorrect : feedbackIncorrect}</p>
                <UiButton onClick={handleReset} variant="outline">Try Again</UiButton>
             </div>
        ) : (
             <UiButton onClick={handleSubmit} disabled={editorEnabled}>{buttonText}</UiButton>
        )}
      </div>

       {selected && editorEnabled && (
        <UiButton variant="destructive" size="icon" className="absolute top-0 right-0 z-10 h-6 w-6" onClick={() => editorActions.delete(id)}>
          <Trash2 className="h-3 w-3" />
        </UiButton>
      )}
    </div>
  );
};

MultipleChoiceQuestionComponent.craft = {
  displayName: "Multiple Choice Question",
  isCanvas: false,
  props: {
    title: "Question 1 of 2",
    prompt: "You run a local bakery in a small town and are considering taking your business online. How can going digital benefit your business?",
    instruction: "Select the 4 correct answers, then submit.",
    allowMultipleAnswers: true,
    options: [
      { text: "You can communicate with customers more easily", isCorrect: true },
      { text: "You can target ads at local customers", isCorrect: true },
      { text: "You get more insights into customers' online behaviour", isCorrect: true },
      { text: "You can buy a pizza oven", isCorrect: false },
      { text: "You are more visible to customers", isCorrect: true },
      { text: "You would have less need to communicate with customers", isCorrect: false },
    ],
    feedbackCorrect: "Correct! These are all great benefits of a digital presence.",
    feedbackIncorrect: "That's not quite right. Review the correct answers.",
    buttonText: "Submit",
  },
  related: {
    settings: MultipleChoiceQuestionSettings,
  },
};