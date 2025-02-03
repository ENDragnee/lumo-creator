// slider-widget.tsx
"use client";
import { useState } from "react";
import { useNode } from "@craftjs/core";
import { Slider } from "@/components/ui/slider";

interface SliderWidgetProps {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export function SliderWidget({ min, max, step, defaultValue }: SliderWidgetProps) {
  const [value, setValue] = useState(defaultValue);
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected
  }));
  return (
    <div 
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-64 space-y-4 p-4 ${selected ? "border-2 border-ios-blue" : ""}`}
    >
      <Slider 
        min={min} 
        max={max} 
        step={step} 
        value={[value]} 
        onValueChange={([newValue]) => setValue(newValue)} 
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{min}</span>
        <span>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export const CraftSliderWidget = ({ min, max, step, defaultValue }: SliderWidgetProps) => {
  return <SliderWidget min={min} max={max} step={step} defaultValue={defaultValue} />;
};

CraftSliderWidget.craft = {
  displayName: "Slider Widget",
  props: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};