"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ToolError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[BioTools tool] error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background p-6">
      <div className="text-center space-y-3 max-w-md">
        <div className="text-4xl font-mono text-primary">!</div>
        <h2 className="text-xl font-bold text-foreground font-mono">
          Tool failed to load / 工具加载失败
        </h2>
        <p className="text-xs text-muted-foreground font-mono break-words">
          {error?.message || "Unknown error"}
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={reset} size="sm" variant="default" className="font-mono">
            Retry / 重试
          </Button>
          <Button asChild size="sm" variant="outline" className="font-mono">
            <Link href="/">Home / 首页</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
