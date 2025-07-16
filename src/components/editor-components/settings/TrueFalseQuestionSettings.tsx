"use client";

import React from 'react';
import { useNode } from '@craftjs/core';
import { TrueFalseQuestionProps } from '../TrueFalseQuestionComponent';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

export const TrueFalseQuestionSettings = () => {
  const {
    actions: { setProp },
    questionText,
    correctAnswer,
    explanation
  } = useNode<TrueFalseQuestionProps>((node) => node.data.props);

  return (
    <Accordion type="multiple" defaultValue={['content']} className="w-full p-1">
      <AccordionItem value="content">
        <AccordionTrigger className="p-2">Question Content</AccordionTrigger>
        <AccordionContent className="p-2 space-y-4">
          <div className="grid gap-2">
            <Label>Question Statement</Label>
            <Textarea
              value={questionText}
              rows={3}
              onChange={(e) => setProp((props: TrueFalseQuestionProps) => (props.questionText = e.target.value), 500)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Correct Answer</Label>
            <RadioGroup
              value={String(correctAnswer)}
              onValueChange={(val) => setProp((props: TrueFalseQuestionProps) => props.correctAnswer = (val === 'true'))}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false">False</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label>Explanation (for incorrect answers)</Label>
            <Textarea
              value={explanation}
              rows={4}
              onChange={(e) => setProp((props: TrueFalseQuestionProps) => (props.explanation = e.target.value), 500)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};