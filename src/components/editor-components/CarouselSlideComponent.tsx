"use client";

import React from 'react';
import { useEditor, useNode, UserComponent } from '@craftjs/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// --- Props Interface ---
export interface CarouselSlideProps {
  padding?: number;
  children?: React.ReactNode;
}

// --- Craftable Component Definition ---
type CraftableCarouselSlideComponent = UserComponent<CarouselSlideProps>;

export const CarouselSlideComponent: CraftableCarouselSlideComponent = ({
  padding = 16,
  children
}) => {
  const { connectors: { connect, drag }, id } = useNode();
  
  const { selected, actions: editorActions, enabled: editorEnabled } = useEditor((state, query) => ({
    selected: query.getEvent('selected').contains(id),
    enabled: state.options.enabled,
  }));

  const hasChildren = React.Children.count(children) > 0;
  
  const style: React.CSSProperties = {
    padding: `${padding}px`
  };

  return (
    <div
      ref={(ref: HTMLDivElement | null) => { if (ref) connect(drag(ref)); }}
      className="relative flex-[0_0_100%] min-w-0" // Embla Carousel requirement
    >
      <div 
        style={style}
        className={cn(
            "min-h-[200px] w-full flex flex-col items-center justify-center",
            !hasChildren && editorEnabled && "border-2 border-dashed border-blue-300 rounded-lg",
        )}
      >
        {hasChildren ? children : (
            editorEnabled && <p className="text-muted-foreground text-sm">Drag components for this slide here</p>
        )}
      </div>

       {/* This delete button is for the slide itself, useful for debugging/advanced editing */}
       {selected && editorEnabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 z-10 h-6 w-6 opacity-80 hover:opacity-100"
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onClick={() => editorActions.delete(id)}
          aria-label="Delete Slide"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

CarouselSlideComponent.craft = {
  displayName: "Carousel Slide",
  isCanvas: true,
  props: {
    padding: 16,
  },
  rules: {
    canMoveIn: (incoming, self, query) => {
      // Prevents nesting another carousel inside a slide
      const forbidden = ['Carousel', 'Carousel Slide'];
      return incoming.every(node => !forbidden.includes(query(node.id).get().data.displayName));
    }
  }
};