"use client"

import { useI18n } from "@/lib/i18n"
import { Badge } from "./ui/badge"

export function ProjectIntro() {
  const { t } = useI18n()

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-background">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* 项目标题和描述 */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-primary font-mono">
            {t("nav.title", "BioTools")}
          </h1>
          <p className="text-xl text-muted-foreground font-mono max-w-2xl mx-auto">
            {t("intro.subtitle", "生物信息学工具库")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="font-mono">v1.0.0</Badge>
            <Badge variant="outline" className="font-mono">Next.js</Badge>
            <Badge variant="outline" className="font-mono">TypeScript</Badge>
          </div>
        </div>

        {/* 简单的使用说明 */}
        <div className="text-center">
          <p className="text-muted-foreground font-mono text-sm">
            {t("intro.usage", "选择左侧工具开始使用，点击右上角可切换语言")}
          </p>
        </div>
      </div>
    </div>
  )
}
