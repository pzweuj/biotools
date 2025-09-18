"use client"

import { useI18n } from "@/lib/i18n"
import type { Tool } from "@/types/tool"

interface ToolDisplayProps {
  tool: Tool | null
}

export function ToolDisplay({ tool }: ToolDisplayProps) {
  const { t } = useI18n()

  if (!tool) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 font-mono text-primary">{">"}_</div>
          <h2 className="text-2xl font-bold mb-3 text-balance font-mono">{t("nav.welcome")}</h2>
          <p className="text-muted-foreground text-pretty font-mono text-sm leading-relaxed">{t("nav.welcomeDesc")}</p>
        </div>
      </div>
    )
  }

  const ToolComponent = tool.component

  return (
    <div className="w-full min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <ToolComponent />
      </div>
    </div>
  )
}
