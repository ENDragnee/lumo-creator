"use client";

import React from 'react';
import { useNode } from '@craftjs/core';
import { MultipleChoiceQuestionProps, QuestionOption } from '../MultipleChoiceQuestionComponent';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

export const MultipleChoiceQuestionSettings = () => {
  const {
    actions: { setProp },
    title, prompt, instruction, allowMultipleAnswers, options, feedbackCorrect, feedbackIncorrect, buttonText
  } = useNode<MultipleChoiceQuestionProps>(node => node.data.props);

  const handleOptionChange = (index: number, newValues: Partial<QuestionOption>) => {
    const newOptions = [...(options || [])];
    newOptions[index] = { ...newOptions[index], ...newValues };
    setProp((props: MultipleChoiceQuestionProps) => props.options = newOptions);
  };

  const handleAddOption = () => {
    const newOptions = [...(options || []), { text: "New Option", isCorrect: false }];
    setProp((props: MultipleChoiceQuestionProps) => props.options = newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...(options || [])];
    newOptions.splice(index, 1);
    setProp((props: MultipleChoiceQuestionProps) => props.options = newOptions);
  };

  return (
    <Accordion type="multiple" defaultValue={['content', 'options']} className="w-full p-1">
      <AccordionItem value="content">
        <AccordionTrigger className="p-2">Question Content</AccordionTrigger>
        <AccordionContent className="p-2 space-y-4">
          <div className="grid gap-2"><Label>Title</Label><Input value={title} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.title = e.target.value, 500)} /></div>
          <div className="grid gap-2"><Label>Prompt (Markdown)</Label><Textarea value={prompt} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.prompt = e.target.value, 500)} /></div>
          <div className="grid gap-2"><Label>Instruction</Label><Input value={instruction} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.instruction = e.target.value, 500)} /></div>
          <div className="grid gap-2"><Label>Button Text</Label><Input value={buttonText} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.buttonText = e.target.value, 500)} /></div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="options">
        <AccordionTrigger className="p-2">Answer Options</AccordionTrigger>
        <AccordionContent className="p-2 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label>Allow Multiple Answers</Label>
            <Switch checked={allowMultipleAnswers} onCheckedChange={(val) => setProp((props: MultipleChoiceQuestionProps) => props.allowMultipleAnswers = val)} />
          </div>
          <div className="space-y-3">
            {options?.map((option, index) => (
              <div key={index} className="p-3 rounded-md border space-y-2 bg-background">
                <Label>Option {index + 1}</Label>
                <Input value={option.text} onChange={(e) => handleOptionChange(index, { text: e.target.value })} />
                <div className="flex items-center justify-between">
                    <Label htmlFor={`correct-${index}`} className="text-sm">Correct Answer?</Label>
                    <Switch id={`correct-${index}`} checked={option.isCorrect} onCheckedChange={(val) => handleOptionChange(index, { isCorrect: val })} />
                </div>
                <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600" onClick={() => handleRemoveOption(index)}><Trash2 className="h-4 w-4 mr-2" />Remove</Button>
              </div>
            ))}
          </div>
          <Button onClick={handleAddOption} variant="outline" className="w-full">Add Answer Option</Button>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="feedback">
        <AccordionTrigger className="p-2">Feedback Messages</AccordionTrigger>
        <AccordionContent className="p-2 space-y-4">
          <div className="grid gap-2"><Label>Feedback for Correct Answer</Label><Textarea value={feedbackCorrect} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.feedbackCorrect = e.target.value, 500)} /></div>
          <div className="grid gap-2"><Label>Feedback for Incorrect Answer</Label><Textarea value={feedbackIncorrect} onChange={(e) => setProp((props: MultipleChoiceQuestionProps) => props.feedbackIncorrect = e.target.value, 500)} /></div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};