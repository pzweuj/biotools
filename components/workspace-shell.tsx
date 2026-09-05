"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { ToolSidebar } from "@/components/tool-sidebar"
import { getToolCategories } from "@/lib/config/tools"

interface WorkspaceShellProps {
  children: ReactNode
  selectedToolId?: string
}

/** Shared application frame for the home screen and every tool route. */
export function WorkspaceShell({ children, selectedToolId = "" }: WorkspaceShellProps) {
  const toolCategories = useMemo(() => getToolCategories(), [])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="workspace-shell flex h-screen min-h-screen flex-col bg-background">
      <Header />
      <div
        className="workspace-layout grid min-h-0 flex-1 pt-14"
        style={{
          gridTemplateColumns: sidebarCollapsed
            ? "0 minmax(0, 1fr)"
            : "20rem minmax(0, 1fr)",
        }}
      >
        <ToolSidebar
          categories={toolCategories}
          selectedToolId={selectedToolId}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className="min-w-0 min-h-0 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
