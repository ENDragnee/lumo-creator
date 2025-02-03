import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Icons } from "@/components/ui/icons"

export function PropertiesPanel() {
  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="animate">Animate</Label>
              <Switch id="animate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed">Animation Speed</Label>
              <Slider id="speed" min={0} max={100} step={1} defaultValue={[50]} />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">AI Tips</h3>
          <div className="bg-blue-50 p-3 rounded-md flex items-start space-x-3">
            <Icons.lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-blue-700">Add a simulation here to enhance engagement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

