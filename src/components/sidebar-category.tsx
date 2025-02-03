import type { LucideIcon } from "lucide-react"

interface SidebarCategoryProps {
  title: string
  items: {
    icon: LucideIcon
    label: string
  }[]
}

export function SidebarCategory({ title, items }: SidebarCategoryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="space-y-1">
        {items.map((item, i) => (
          <button key={i} className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted">
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

