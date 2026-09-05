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
      <div className="flex min-h-full items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          <div className="mb-6 font-mono text-5xl text-primary">{">"}_</div>
          <h2 className="mb-3 font-display text-3xl font-medium leading-tight">{t("nav.welcome")}</h2>
          <p className="text-pretty text-sm leading-6 text-muted-foreground">{t("nav.welcomeDesc")}</p>
        </div>
      </div>
    )
  }

  const ToolComponent = tool.component

  return (
    <div className="tool-display min-h-full px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="mx-auto w-full max-w-[92rem]">
        <ToolComponent />
      </div>
    </div>
  )
}
