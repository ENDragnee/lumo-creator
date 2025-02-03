import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

export function TopNavigationBar() {
  return (
    <header className="h-16 bg-[#F5F5F7] border-b border-gray-200 px-4 flex items-center justify-between">
      <Button variant="ghost" className="text-gray-700">
        <Icons.template className="mr-2 h-5 w-5" />
        Templates
      </Button>
      <div className="flex items-center space-x-4">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6">Publish</Button>
        <Button variant="ghost" size="icon">
          <Icons.user className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

