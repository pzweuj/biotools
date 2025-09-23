"use client"

import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ToolDisplay } from "@/components/tool-display"
import { getToolCategories } from "@/lib/config/tools"

interface ToolPageProps {
  params: Promise<{
    toolId: string
  }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params
  const toolCategories = getToolCategories()
  const allTools = toolCategories.flatMap(category => category.tools)
  const selectedTool = allTools.find(tool => tool.id === toolId)

  if (!selectedTool) {
    notFound()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 relative pt-14">
        <ToolSidebar 
          categories={toolCategories} 
          selectedToolId={toolId}
        />
        <div className="flex-1 overflow-y-auto">
          <ToolDisplay tool={selectedTool} />
        </div>
      </div>
    </div>
  )
}
