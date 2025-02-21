import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimulationList } from "@/components/simulation-list";

export function SimulationSidebar() {
  const [simulations, setSimulations] = useState<{ url: string }[]>([]);
  const [simulationLink, setSimulationLink] = useState("");

  const handleSimulationLinkUpload = () => {
    if (simulationLink) {
      setSimulations((prev) => [
        ...prev,
        { url: simulationLink }
      ]);
      setSimulationLink("");
    }
  };

  const handleSimulationRemove = (url: string) => {
    setSimulations((prev) => prev.filter(sim => sim.url !== url));
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Simulation Library</h2>
      <div>
        <Input
          type="text"
          placeholder="Enter simulation URL"
          value={simulationLink}
          onChange={(e) => setSimulationLink(e.target.value)}
        />
        <Button onClick={handleSimulationLinkUpload} className="mt-2">
          Add Simulation Link
        </Button>
      </div>
      <SimulationList simulations={simulations} onRemove={handleSimulationRemove} />
    </div>
  );
}
