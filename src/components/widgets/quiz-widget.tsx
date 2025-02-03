// quiz-widget.tsx
"use client";
import { useState } from "react";
import { useNode } from "@craftjs/core";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Resizable } from "../resizeable";

interface QuizWidgetProps {
  question: string;
  options: string[];
  correctAnswer: number;
}

export function QuizWidget({ question, options, correctAnswer }: QuizWidgetProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  // CraftJS integration
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected
  }));
  return (
    <Resizable>

      <div 
        ref={(ref) => {
          if (ref) {
            connect(drag(ref));
          }
        }}
        className={`w-64 space-y-4 p-4 ${selected ? "border-2 border-ios-blue" : ""}`}
      >
        <h3 className="font-medium">{question}</h3>
        <RadioGroup onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}>
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        {selectedAnswer !== null && (
          <p className={selectedAnswer === correctAnswer ? "text-green-500" : "text-red-500"}>
            {selectedAnswer === correctAnswer ? "Correct!" : "Incorrect. Try again!"}
          </p>
        )}
      </div>
    </Resizable>
  );
}

export const CraftQuizWidget = ({ question, options, correctAnswer }: QuizWidgetProps) => {
  return <QuizWidget question={question} options={options} correctAnswer={correctAnswer} />;
};

CraftQuizWidget.craft = {
  displayName: "Quiz Widget",
  props: {
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswer: 1
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};