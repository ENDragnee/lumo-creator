"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, useNode, UserComponent } from '@craftjs/core';
import { CarouselSettings } from './settings/CarouselSettings';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';

// --- Props Interface ---
export interface CarouselProps {
  showArrows?: boolean;
  showDots?: boolean;
  loop?: boolean;
  children?: React.ReactNode;
}

// --- Craftable Component Definition ---
type CraftableCarouselComponent = UserComponent<CarouselProps>;

export const CarouselComponent: CraftableCarouselComponent = ({
  showArrows = true,
  showDots = true,
  loop = false,
  children
}) => {
  const { connectors: { connect, drag }, id } = useNode();
  
  const { selected, actions: editorActions, enabled: editorEnabled } = useEditor((state, query) => ({
    selected: query.getEvent('selected').contains(id),
    enabled: state.options.enabled,
  }));

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect(); // Set initial selected index
    return () => { emblaApi.off('select', onSelect) };
  }, [emblaApi]);

  const slideCount = React.Children.count(children);

  return (
    <div
      ref={(ref: HTMLDivElement | null) => { if (ref) connect(drag(ref)); }}
      className="relative w-full"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {children}
        </div>
      </div>
      
      {showArrows && slideCount > 1 && (
        <>
          <Button variant="outline" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full z-10 opacity-70 hover:opacity-100" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full z-10 opacity-70 hover:opacity-100" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {showDots && slideCount > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full bg-primary transition-all",
                index === selectedIndex ? "opacity-100 w-4" : "opacity-50"
              )}
            />
          ))}
        </div>
      )}

       {selected && editorEnabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-0 right-0 z-20 -mt-3 -mr-3 h-6 w-6 opacity-80 hover:opacity-100"
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onClick={() => editorActions.delete(id)}
          aria-label="Delete Carousel"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

CarouselComponent.craft = {
  displayName: "Carousel",
  isCanvas: true,
  props: {
    showArrows: true,
    showDots: true,
    loop: false,
  },
  related: {
    settings: CarouselSettings,
  },
  rules: {
    canMoveIn: (incoming, self, query) => {
      return incoming.every(node => query(node.id).get().data.displayName === 'Carousel Slide');
    }
  }
};
