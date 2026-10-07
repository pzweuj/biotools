"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 仅在生产环境写一条 error 级别（next.config 的 removeConsole 保留 error）
    console.error("[BioTools] Unhandled error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-5xl font-mono text-primary">{">"}_</div>
        <h1 className="text-2xl font-bold text-foreground font-mono">
          Something went wrong / 出现错误
        </h1>
        {process.env.NODE_ENV === "production" ? (
          <p className="text-sm text-muted-foreground font-mono break-words">
            请重试。若问题持续，把下面的编号发给维护者。
            <br />
            Please retry. If this continues, send the reference below to the maintainer.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground font-mono break-words">
            {error?.message || "Unknown error"}
          </p>
        )}
        {error?.digest && (
          <p className="text-xs text-muted-foreground font-mono opacity-70">
            digest: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={reset} variant="default" className="font-mono">
            Retry / 重试
          </Button>
          <Button asChild variant="outline" className="font-mono">
            <Link href="/">Home / 首页</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
