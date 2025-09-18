"use client"

import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ToolDisplay } from "@/components/tool-display"
import { getToolCategories } from "@/lib/config/tools"

interface ToolPageProps {
  params: {
    toolId: string
  }
}

export default function ToolPage({ params }: ToolPageProps) {
  const toolCategories = getToolCategories()
  const allTools = toolCategories.flatMap(category => category.tools)
  const selectedTool = allTools.find(tool => tool.id === params.toolId)

  if (!selectedTool) {
    notFound()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <ToolSidebar 
          categories={toolCategories} 
          selectedToolId={params.toolId}
        />
        <div className="flex-1 overflow-hidden">
          <ToolDisplay tool={selectedTool} />
        </div>
      </div>
    </div>
  )
}
