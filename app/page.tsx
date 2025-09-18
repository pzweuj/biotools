"use client"

import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { ProjectIntro } from "../components/project-intro"
import { getToolCategories } from "@/lib/config/tools"

export default function HomePage() {
  const toolCategories = getToolCategories()

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 relative">
        <ToolSidebar 
          categories={toolCategories} 
          selectedToolId=""
        />
        <div className="flex-1 overflow-auto">
          <ProjectIntro />
        </div>
      </div>
    </div>
  )
}
