"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Clock3, Globe, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import {
  loadRecentToolIds,
  recordRecentTool,
  RECENT_TOOLS_STORAGE_KEY,
  RECENT_TOOLS_UPDATED_EVENT,
} from "@/lib/recent-tools"
import type { Tool, ToolCategory } from "@/types/tool"

interface ToolSidebarProps {
  categories: ToolCategory[]
  selectedToolId: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onToolSelect?: (toolId: string) => void
}

export function ToolSidebar({
  categories,
  selectedToolId,
  collapsed,
  onCollapsedChange,
  onToolSelect,
}: ToolSidebarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [recentToolIds, setRecentToolIds] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const wasMobileRef = useRef(false)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const scrollWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile && !wasMobileRef.current && !collapsed) onCollapsedChange(true)
      if (!mobile && wasMobileRef.current && collapsed) onCollapsedChange(false)
      wasMobileRef.current = mobile
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [collapsed, onCollapsedChange])

  useEffect(() => {
    const refreshRecentTools = () => setRecentToolIds(loadRecentToolIds())
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENT_TOOLS_STORAGE_KEY) refreshRecentTools()
    }

    refreshRecentTools()
    window.addEventListener(RECENT_TOOLS_UPDATED_EVENT, refreshRecentTools)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener(RECENT_TOOLS_UPDATED_EVENT, refreshRecentTools)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  useEffect(() => {
    if (selectedToolId) setRecentToolIds(recordRecentTool(selectedToolId))
  }, [selectedToolId])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      if (scrollWriteTimerRef.current) clearTimeout(scrollWriteTimerRef.current)
      scrollWriteTimerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem("sidebar-scroll-position", String(viewport.scrollTop))
        } catch {
          // Storage can be disabled by the browser; scrolling still works.
        }
      }, 200)
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      if (scrollWriteTimerRef.current) clearTimeout(scrollWriteTimerRef.current)
    }
  }, [])

  const flatTools = useMemo(() => categories.flatMap((category) => category.tools), [categories])
  const filteredFlat = useMemo(() => {
    if (!searchQuery.trim()) return flatTools
    const query = searchQuery.toLowerCase()
    return flatTools.filter((tool) => {
      const name = t(tool.nameKey).toLowerCase()
      const description = t(tool.descriptionKey).toLowerCase()
      return name.includes(query) || description.includes(query) || tool.id.includes(query)
    })
  }, [flatTools, searchQuery, t])
  const isSearching = searchQuery.trim().length > 0
  const recentTools = useMemo(
    () =>
      recentToolIds
        .slice(0, 5)
        .map((toolId) => flatTools.find((tool) => tool.id === toolId))
        .filter((tool): tool is Tool => Boolean(tool)),
    [flatTools, recentToolIds],
  )

  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    try {
      const saved = sessionStorage.getItem("sidebar-scroll-position")
      if (saved) viewport.scrollTop = Number.parseInt(saved, 10)
    } catch {
      // Storage can be disabled by the browser.
    }
  }, [filteredFlat.length, isSearching])

  const handleToolSelect = (toolId: string) => {
    recordRecentTool(toolId)
    onToolSelect?.(toolId)
    if (!onToolSelect) router.push(`/tools/${toolId}`)
    if (isMobile) onCollapsedChange(true)
  }

  const renderToolButton = (tool: Tool) => (
    <Button
      key={tool.id}
      variant="ghost"
      className={cn(
        "sidebar-tool-button min-h-10 w-full justify-between rounded-md px-3 py-2.5 text-left text-sm font-sans font-medium transition-colors",
        selectedToolId === tool.id
          ? "!bg-primary !text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
      onClick={() => handleToolSelect(tool.id)}
      aria-label={t(tool.nameKey)}
      title={t(tool.descriptionKey, t(tool.nameKey))}
    >
      <span className="flex-1 text-left">{t(tool.nameKey)}</span>
      {tool.external && (
        <span
          className={cn(
            "ml-2 flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono",
            selectedToolId === tool.id
              ? "border-primary-foreground/40 text-primary-foreground/90"
              : "border-border text-muted-foreground",
          )}
          title={t("nav.externalTool", "Online")}
        >
          <Globe className="h-3 w-3" />
          {t("nav.externalTool", "Online")}
        </span>
      )}
    </Button>
  )

  return (
    <>
      <aside
        className={cn(
          "workspace-sidebar relative z-40 min-h-0 overflow-visible",
          isMobile ? "fixed left-0 top-14 h-[calc(100vh-3.5rem)]" : "h-full",
          collapsed ? "w-0" : isMobile ? "w-80" : "w-full",
        )}
        aria-label={t("nav.subtitle")}
      >
        <div
          id="workspace-sidebar-panel"
          aria-hidden={collapsed}
          className={cn(
            "h-full w-80 overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-out",
            collapsed ? "-translate-x-full" : "translate-x-0",
          )}
        >
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight text-sidebar-foreground">
                  {t("nav.subtitle")}
                </h2>
                <p className="mt-1 text-sm text-sidebar-foreground/70">
                  {t("nav.selectTool")}
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 border-sidebar-border bg-sidebar pl-9 text-sm"
                aria-label={t("common.search")}
              />
            </div>
          </div>

          <div ref={scrollViewportRef} className="sidebar-scroll h-[calc(100%-8.75rem)] overflow-y-auto">
            <div className="space-y-5 p-3">
              {isSearching ? (
                <div className="space-y-1">{filteredFlat.map(renderToolButton)}</div>
              ) : (
                <>
                  {recentTools.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        {t("nav.recentTools")}
                      </div>
                      {recentTools.map(renderToolButton)}
                    </div>
                  )}
                  {categories.map((category) => (
                    <div key={category.id} className="space-y-1">
                      <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                        {t(category.nameKey)}
                      </div>
                      {category.tools.map(renderToolButton)}
                    </div>
                  ))}
                </>
              )}
              {isSearching && filteredFlat.length === 0 && (
                <div className="py-8 text-center text-sm text-sidebar-foreground/50">
                  {t("tools.noResults", "No matching tools")}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "sidebar-toggle-button group absolute top-1/2 z-[60] h-12 w-6 -translate-y-1/2 rounded-none border-0 bg-transparent p-0 text-foreground hover:bg-transparent",
            collapsed ? "left-0 right-auto" : "right-[-1.5rem]",
            isMobile && "h-11 w-11",
            isMobile && "justify-start",
            isMobile && !collapsed && "right-[-2.75rem]",
          )}
          aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          aria-controls="workspace-sidebar-panel"
          aria-expanded={!collapsed}
          title={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        >
          <span
            aria-hidden="true"
            className={cn(
              "sidebar-toggle-visual flex items-center justify-center rounded-r-md rounded-l-none border border-border bg-background text-foreground transition-colors group-hover:bg-muted",
              isMobile ? "h-10 w-7" : "h-full w-full",
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </span>
        </Button>
      </aside>

      {isMobile && !collapsed && (
        <button
          type="button"
          aria-label={t("nav.collapseSidebar")}
          className="fixed inset-0 z-30 cursor-default bg-black/20 md:hidden"
          onClick={() => onCollapsedChange(true)}
        />
      )}
    </>
  )
}
