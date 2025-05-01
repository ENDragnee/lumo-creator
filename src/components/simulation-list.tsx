"use client";

import { useEditor } from "@craftjs/core";
import { SimulationComponent } from "@/components/user/simulation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Simulation {
  url: string;
}

interface SimulationListProps {
  simulations: Simulation[];
  onRemove: (url: string) => void;
}

export function SimulationList({ simulations, onRemove }: SimulationListProps) {
  const { connectors } = useEditor();

  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">Your Simulations</h3>
      <div className="grid grid-cols-1 gap-2">
        {simulations.map((simulation, index) => (
          <div key={index} className="relative group  hover:scale-105 transition-transform duration-200">
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <SimulationComponent src={simulation.url} />
                  );
                }
              }}
              className="cursor-move"
            >
              <div className="border p-2 rounded-md">
                <iframe
                  src={simulation.url}
                  width="100%"
                  height="150"
                  frameBorder="0"
                  className="w-full"
                ></iframe>
              </div>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(simulation.url)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
