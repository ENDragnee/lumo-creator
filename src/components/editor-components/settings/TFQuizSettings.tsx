"use client";

import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
// FIX: Import the renamed props type
import { TFQuizProps } from '../TFQuizComponent'; 
import { TrueFalseQuestionComponent } from '../TrueFalseQuestionComponent';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const TFQuizSettings = () => {
  // FIX: Use the renamed props type
  const { id: selfId, actions: { setProp }, title } = useNode<TFQuizProps>(node => node.data.props);
  const { actions: { add }, query } = useEditor();

  const handleAddQuestion = () => {
    const newQuestion = query.createNode(<TrueFalseQuestionComponent />);
    add(newQuestion, selfId);
  };

  return (
    <Accordion type="multiple" defaultValue={['general', 'questions']} className="w-full p-1">
       <AccordionItem value="general">
        <AccordionTrigger className="p-2">General</AccordionTrigger>
        <AccordionContent className="p-2">
          <div className="grid gap-2">
            <Label>Quiz Title</Label>
            <Input
              value={title}
              // FIX: Use the renamed props type
              onChange={(e) => setProp((props: TFQuizProps) => (props.title = e.target.value), 500)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="questions">
        <AccordionTrigger className="p-2">Manage Questions</AccordionTrigger>
        <AccordionContent className="p-2">
          <Button onClick={handleAddQuestion} className="w-full">
            Add New Question
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};