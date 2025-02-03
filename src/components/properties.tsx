import { Zap } from "lucide-react"

export function Properties() {
  return (
    <div className="w-80 border-l">
      <div className="p-4 border-b">
        <h2 className="font-medium">Properties</h2>
      </div>
      <div className="p-4 text-sm text-muted-foreground">No element selected</div>
      <div className="border-t p-4">
        <div className="flex items-center space-x-2 text-sm">
          <Zap className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium">AI Tips</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Add a simulation here to enhance engagement.</p>
      </div>
    </div>
  )
}

