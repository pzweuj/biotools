"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ToolDisplay } from "@/components/tool-display"
import { getToolCategories } from "@/lib/config/tools"
import type { Tool } from "@/types/tool"

export default function ToolPage() {
  const router = useRouter()
  const params = useParams()
  const toolId = params.toolId as string
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolCategories] = useState(() => getToolCategories())

  useEffect(() => {
    const allTools = toolCategories.flatMap(category => category.tools)
    const tool = allTools.find(tool => tool.id === toolId)
    
    if (!tool) {
      router.push("/")
    } else {
      setSelectedTool(tool)
    }
  }, [toolId, toolCategories, router])

  if (!selectedTool) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 relative pt-14">
        <ToolSidebar 
          categories={toolCategories} 
          selectedToolId={toolId}
        />
        <div className="flex-1 overflow-y-auto main-content">
          <ToolDisplay tool={selectedTool} />
        </div>
      </div>
    </div>
  )
}
