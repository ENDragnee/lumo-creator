"use client";

import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { CarouselProps } from '../CarouselComponent';
import { CarouselSlideComponent } from '../CarouselSlideComponent';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const CarouselSettings = () => {
  const { id: selfId, actions: { setProp } } = useNode();
  const { actions: { add }, query } = useEditor();

  const { showArrows, showDots, loop } = useNode<CarouselProps>(node => node.data.props);

  const handleAddSlide = () => {
    const newSlide = query.createNode(<CarouselSlideComponent />);
    add(newSlide, selfId);
  };

  return (
    <Accordion type="multiple" defaultValue={['manage', 'options']} className="w-full p-1">
      <AccordionItem value="manage">
        <AccordionTrigger className="p-2">Manage Slides</AccordionTrigger>
        <AccordionContent className="p-2">
          <Button onClick={handleAddSlide} className="w-full">Add New Slide</Button>
           <p className="text-xs text-muted-foreground mt-2 text-center">
            You can delete individual slides by selecting them on the canvas.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="options">
        <AccordionTrigger className="p-2">Carousel Options</AccordionTrigger>
        <AccordionContent className="p-2 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label>Show Arrows</Label>
            <Switch checked={showArrows} onCheckedChange={(val) => setProp((props: CarouselProps) => props.showArrows = val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label>Show Dots</Label>
            <Switch checked={showDots} onCheckedChange={(val) => setProp((props: CarouselProps) => props.showDots = val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label>Loop Slides</Label>
            <Switch checked={loop} onCheckedChange={(val) => setProp((props: CarouselProps) => props.loop = val)} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};