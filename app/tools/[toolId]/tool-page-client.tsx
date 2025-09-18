"use client"

import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ToolDisplay } from "@/components/tool-display"
import { getToolCategories } from "@/lib/config/tools"

interface ToolPageClientProps {
  selectedToolId: string
}

export function ToolPageClient({ selectedToolId }: ToolPageClientProps) {
  const toolCategories = getToolCategories()
  const allTools = toolCategories.flatMap(category => category.tools)
  const selectedTool = allTools.find(tool => tool.id === selectedToolId)

  if (!selectedTool) {
    notFound()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ToolSidebar 
          categories={toolCategories} 
          selectedToolId={selectedToolId}
        />
        <ToolDisplay tool={selectedTool} />
      </div>
    </div>
  )
}
