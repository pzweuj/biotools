"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface TryExampleProps {
  /** 示例数据对象 —— 会回调给父组件 */
  example: Record<string, unknown>
  /** 父组件设置示例数据的回调 */
  onApply: (example: Record<string, unknown>) => void
  /** 可选的自定义标签 */
  label?: string
}

export function TryExample({ example, onApply, label }: TryExampleProps) {
  const { t } = useI18n()

  return (
    <Button
      variant="outline"
      size="sm"
      className="font-mono text-xs gap-1.5 hover:bg-muted"
      onClick={() => onApply(example)}
      title={t("common.tryExample", "Load example data")}
    >
      <Zap className="w-3 h-3" />
      {label ?? t("common.tryExample", "Try example")}
    </Button>
  )
}
