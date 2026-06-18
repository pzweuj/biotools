"use client"

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { Tool, ToolCategory } from "@/types/tool"

interface ToolSidebarProps {
  categories: ToolCategory[]
  selectedToolId: string
  onToolSelect?: (toolId: string) => void
}

export function ToolSidebar({ categories, selectedToolId, onToolSelect }: ToolSidebarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const scrollWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  })
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  })
  const [isHovering, setIsHovering] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [touchTimeout, setTouchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  // 初始化 body 类名
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isCollapsed) document.body.classList.add("sidebar-collapsed")
      else document.body.classList.remove("sidebar-collapsed")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 滚动位置：节流写入 sessionStorage（200 ms 防抖）
  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      if (scrollWriteTimerRef.current) clearTimeout(scrollWriteTimerRef.current)
      scrollWriteTimerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem("sidebar-scroll-position", String(viewport.scrollTop))
        } catch {}
      }, 200)
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      if (scrollWriteTimerRef.current) clearTimeout(scrollWriteTimerRef.current)
    }
  }, [])

  // 屏幕尺寸变化
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      if (isMobile === mobile) return
      setIsMobile(mobile)
      if (isMobile && !mobile && isCollapsed) {
        setIsCollapsed(false)
        document.body.classList.remove("sidebar-collapsed")
      } else if (!isMobile && mobile) {
        setIsCollapsed(true)
        document.body.classList.add("sidebar-collapsed")
      }
    }

    window.addEventListener("resize", checkScreenSize)
    return () => {
      window.removeEventListener("resize", checkScreenSize)
      if (touchTimeout) clearTimeout(touchTimeout)
    }
  }, [isMobile, isCollapsed, touchTimeout])

  const handleToolSelect = (toolId: string) => {
    if (onToolSelect) onToolSelect(toolId)
    else router.push(`/tools/${toolId}`)
    if (isMobile) {
      setIsCollapsed(true)
      document.body.classList.add("sidebar-collapsed")
    }
  }

  const toggleSidebar = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    if (next) document.body.classList.add("sidebar-collapsed")
    else document.body.classList.remove("sidebar-collapsed")
  }

  // 扁平的搜索结果（搜索模式下使用）
  const flatTools = useMemo(() => categories.flatMap((c) => c.tools), [categories])
  const filteredFlat = useMemo(() => {
    if (!searchQuery.trim()) return flatTools
    const q = searchQuery.toLowerCase()
    return flatTools.filter((tool) => {
      const name = t(tool.nameKey).toLowerCase()
      const desc = t(tool.descriptionKey).toLowerCase()
      return name.includes(q) || desc.includes(q) || tool.id.includes(q)
    })
  }, [flatTools, searchQuery, t])

  const isSearching = searchQuery.trim().length > 0

  // 恢复滚动位置
  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    try {
      const saved = sessionStorage.getItem("sidebar-scroll-position")
      if (saved) viewport.scrollTop = parseInt(saved, 10)
    } catch {}
  }, [filteredFlat.length, isSearching])

  const renderToolButton = (tool: Tool) => (
    <Button
      key={tool.id}
      variant="ghost"
      className={cn(
        "sidebar-tool-button w-full justify-between h-auto min-h-10 py-3 px-4 font-mono text-sm whitespace-normal text-left cursor-pointer transition-colors duration-200 ease-in-out rounded-md",
        selectedToolId === tool.id
          ? "!bg-black !text-white dark:!bg-white dark:!text-black"
          : "text-sidebar-foreground",
      )}
      onClick={() => handleToolSelect(tool.id)}
      aria-label={t(tool.nameKey)}
      title={t(tool.descriptionKey, t(tool.nameKey))}
    >
      <span className="flex-1 text-left">{t(tool.nameKey)}</span>
      {tool.external && (
        <span
          className={cn(
            "ml-2 flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border",
            selectedToolId === tool.id
              ? "border-white/40 text-white/90 dark:border-black/40 dark:text-black/80"
              : "border-border text-muted-foreground",
          )}
          title={t("nav.externalTool", "Online")}
        >
          <Globe className="w-3 h-3" />
          {t("nav.externalTool", "Online")}
        </span>
      )}
    </Button>
  )

  return (
    <>
      {/* 收起状态下的悬停检测区域 */}
      {!isMobile && isCollapsed && (
        <div
          className="fixed top-14 left-0 w-16 h-[calc(100vh-3.5rem)] z-50"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
      )}

      {/* 移动端收起状态下的触摸提示区域 */}
      {isMobile && isCollapsed && (
        <div
          className="fixed top-[calc(50vh+1.75rem)] -translate-y-1/2 left-0 w-16 h-24 z-50 flex items-center justify-start pl-1"
          onTouchStart={() => {
            if (touchTimeout) clearTimeout(touchTimeout)
            setIsTouching(true)
          }}
        >
          <div className="w-1 h-8 bg-border/70 rounded-full animate-pulse" />
        </div>
      )}

      {/* 侧边栏容器 */}
      <div
        className={cn(
          "fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-40 sidebar-transition overflow-hidden",
          isCollapsed ? "w-0" : "w-80",
        )}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        <div
          className={cn(
            "h-full w-80 bg-sidebar/95 backdrop-blur-sm border-r sidebar-transition",
            isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0",
            isMobile && !isCollapsed && "shadow-lg",
          )}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground font-mono">
                  {t("nav.subtitle")}
                </h2>
                <p className="text-sm text-sidebar-foreground/70 font-mono mt-1">
                  {t("nav.selectTool")}
                </p>
              </div>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono text-sm bg-sidebar border-sidebar-border"
                aria-label={t("common.search")}
              />
            </div>
          </div>

          <div
            ref={scrollViewportRef}
            className="h-[calc(100vh-14rem)] overflow-y-auto sidebar-scroll"
          >
            <div className="p-3">
              {isSearching ? (
                <div className="space-y-1">
                  {filteredFlat.map(renderToolButton)}
                  {filteredFlat.length === 0 && (
                    <div className="text-center py-8 text-sidebar-foreground/50 font-mono text-sm">
                      {t("tools.noResults", "No matching tools")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="px-2 pt-1 pb-2 text-[11px] uppercase tracking-wide font-mono text-sidebar-foreground/50">
                        {t(cat.nameKey)}
                      </div>
                      {cat.tools.map(renderToolButton)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 切换按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-[calc(50vh+1.75rem)] -translate-y-1/2 z-[60] p-0 bg-background/90 backdrop-blur-sm border border-border shadow-md rounded-r-md rounded-l-none sidebar-transition hover:bg-muted cursor-pointer",
          isMobile ? "h-16 w-8 sidebar-toggle-button" : "h-12 w-6",
          isCollapsed ? (isMobile ? "left-2" : "left-0") : "left-80",
          isMobile ? "opacity-100" : isHovering || isTouching ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        onTouchStart={() => {
          if (touchTimeout) clearTimeout(touchTimeout)
          setIsTouching(true)
        }}
        onTouchEnd={() => {
          const timeout = setTimeout(() => setIsTouching(false), 2000)
          setTouchTimeout(timeout)
        }}
        aria-label={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        title={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
      >
        {isCollapsed ? (
          <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        ) : (
          <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        )}
      </Button>

      {/* 移动端遮罩 */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden sidebar-overlay"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}
