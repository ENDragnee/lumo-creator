import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { useEditor } from "@craftjs/core"

export function TopNavigationBar() {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));
  
  const publish = async () => {
    try {
      const response = await fetch('/api/Seralize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query.serialize()),
      });
  
      if (!response.ok) {
        throw new Error('Failed to publish');
      }
  
      const result = await response.json();
      console.log('Published successfully:', result);
      
    } catch (e) {
      console.error('Publish error:', e);
    }
  }
  return (
    <header className="h-16 bg-[#F5F5F7] border-b border-gray-200 px-4 flex items-center justify-between">
      <Button variant="ghost" className="text-gray-700">
        <Icons.template className="mr-2 h-5 w-5" />
        Templates
      </Button>
      <div className="flex items-center space-x-4">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6" onClick={() => {
          publish();
        }}>Publish</Button>
        <Button variant="ghost" size="icon">
          <Icons.user className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

