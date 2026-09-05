"use client"

import { useMemo } from "react"
import { ToolDisplay } from "@/components/tool-display"
import { WorkspaceShell } from "@/components/workspace-shell"
import { getToolById } from "@/lib/config/tools"

interface ToolViewProps {
  toolId: string
}

export function ToolView({ toolId }: ToolViewProps) {
  const selectedTool = useMemo(() => getToolById(toolId), [toolId])

  if (!selectedTool) return null

  return (
    <WorkspaceShell selectedToolId={toolId}>
      <ToolDisplay tool={selectedTool} />
    </WorkspaceShell>
  )
}
