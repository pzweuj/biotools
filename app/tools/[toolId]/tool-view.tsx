"use client"

import { useMemo } from "react"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ToolDisplay } from "@/components/tool-display"
import { getToolCategories, getToolById } from "@/lib/config/tools"

interface ToolViewProps {
  toolId: string
}

export function ToolView({ toolId }: ToolViewProps) {
  const toolCategories = useMemo(() => getToolCategories(), [])
  const selectedTool = useMemo(() => getToolById(toolId), [toolId])

  if (!selectedTool) return null

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 relative pt-14">
        <ToolSidebar categories={toolCategories} selectedToolId={toolId} />
        <div className="flex-1 overflow-y-auto main-content">
          <ToolDisplay tool={selectedTool} />
        </div>
      </div>
    </div>
  )
}
