"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToolCategories } from "@/lib/config/tools"

export default function HomePage() {
  const router = useRouter()
  const toolCategories = getToolCategories()

  useEffect(() => {
    // 重定向到第一个工具
    const firstTool = toolCategories[0]?.tools[0]
    if (firstTool) {
      router.replace(`/tools/${firstTool.id}`)
    }
  }, [router, toolCategories])

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="font-mono text-muted-foreground">Loading...</div>
    </div>
  )
}
