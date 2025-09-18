import type React from "react"

export interface Tool {
  id: string
  nameKey: string
  descriptionKey: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType
}

export interface ToolCategory {
  id: string
  nameKey: string
  tools: Tool[]
}
