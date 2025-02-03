import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Icons } from "@/components/ui/icons"

export function BottomToolbar() {
  return (
    <div className="h-16 bg-white bg-opacity-80 backdrop-blur-md border-t border-gray-200 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Icons.undo className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Icons.redo className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Preview</span>
        <Switch />
      </div>
      <Button variant="ghost" size="icon">
        <Icons.users className="h-5 w-5" />
      </Button>
    </div>
  )
}

