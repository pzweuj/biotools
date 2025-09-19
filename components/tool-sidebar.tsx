"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { ToolCategory } from "@/types/tool"

interface ToolSidebarProps {
  categories: ToolCategory[]
  selectedToolId: string
  onToolSelect?: (toolId: string) => void
}

export function ToolSidebar({ categories, selectedToolId, onToolSelect }: ToolSidebarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      const wasMobile = isMobile
      setIsMobile(mobile)
      
      // 首次加载或从移动端返回桌面端时的处理
      if (!wasMobile && !mobile) {
        // 首次加载桌面端，保持展开状态
        return
      } else if (wasMobile && !mobile && isCollapsed) {
        // 从移动端返回桌面端时自动展开侧边栏
        setIsCollapsed(false)
      } else if (mobile) {
        // 移动端时自动收起
        setIsCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      if (touchTimeout) {
        clearTimeout(touchTimeout)
      }
    }
  }, [isMobile, isCollapsed, touchTimeout])

  const handleToolSelect = (toolId: string) => {
    if (onToolSelect) {
      onToolSelect(toolId)
    } else {
      router.push(`/tools/${toolId}`)
    }
    
    // 在移动端选择工具后自动收起侧边栏
    if (isMobile) {
      setIsCollapsed(true)
    }
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // 将所有工具扁平化为一个数组
  const allTools = useMemo(() => {
    return categories.flatMap(category => category.tools)
  }, [categories])

  // 根据搜索查询过滤工具
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTools
    }
    
    const query = searchQuery.toLowerCase()
    return allTools.filter(tool => 
      t(tool.nameKey).toLowerCase().includes(query)
    )
  }, [allTools, searchQuery, t])

  return (
    <>
      {/* 收起状态下的悬停检测区域 */}
      {!isMobile && isCollapsed && (
        <div 
          className="fixed top-0 left-0 w-16 h-full z-50"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
      )}

      {/* 移动端收起状态下的触摸提示区域 */}
      {isMobile && isCollapsed && (
        <div 
          className="fixed top-1/2 -translate-y-1/2 left-0 w-12 h-20 z-50 flex items-center justify-center"
          onTouchStart={() => {
            if (touchTimeout) {
              clearTimeout(touchTimeout)
            }
            setIsTouching(true)
          }}
        >
          <div className="w-1 h-8 bg-border/50 rounded-full animate-pulse" />
        </div>
      )}

      {/* 侧边栏容器 - 包含悬停检测 */}
      <div 
        className={cn(
          "fixed md:relative top-0 left-0 h-full z-40 sidebar-transition overflow-hidden",
          isCollapsed ? "w-0" : "w-80"
        )}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        {/* 实际侧边栏内容 */}
        <div className={cn(
          "h-full w-80 bg-sidebar/95 backdrop-blur-sm border-r sidebar-transition",
          isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0",
          isMobile && !isCollapsed && "shadow-lg"
        )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground font-mono">{t("nav.subtitle")}</h2>
              <p className="text-sm text-sidebar-foreground/70 font-mono mt-1">{t("nav.selectTool")}</p>
            </div>
          </div>
          
          {/* 搜索栏 */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-mono text-sm bg-sidebar border-sidebar-border"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-3">
            <div className="space-y-1">
              {filteredTools.map((tool) => {
                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    className={cn(
                      "sidebar-tool-button w-full justify-center h-auto min-h-10 py-3 px-4 font-mono text-sm whitespace-normal text-center cursor-pointer transition-colors duration-200 ease-in-out rounded-md",
                      selectedToolId === tool.id
                        ? "!bg-black !text-white"
                        : "text-sidebar-foreground",
                    )}
                    onClick={() => handleToolSelect(tool.id)}
                    aria-label={t(tool.nameKey)}
                    title={t(tool.nameKey)}
                  >
                    {t(tool.nameKey)}
                  </Button>
                )
              })}
            </div>
            
            {filteredTools.length === 0 && searchQuery && (
              <div className="text-center py-8 text-sidebar-foreground/50 font-mono text-sm">
                {t("tools.noResults", "未找到匹配的工具")}
              </div>
            )}
          </div>
        </ScrollArea>
        </div>
      </div>

      {/* 侧边栏切换按钮 - 位于侧边栏边缘中部 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-[60] p-0 bg-background/90 backdrop-blur-sm border border-border shadow-md rounded-r-md rounded-l-none sidebar-transition hover:bg-muted cursor-pointer",
          // 移动端使用更大的按钮尺寸以便触摸
          isMobile ? "h-16 w-8 sidebar-toggle-button" : "h-12 w-6",
          isCollapsed 
            ? "left-0" 
            : isMobile ? "left-80" : "left-80",
          // 移动端始终显示，桌面端悬停时显示
          isMobile ? "opacity-100" : (isHovering || isTouching ? "opacity-100" : "opacity-0 pointer-events-none")
        )}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        onTouchStart={() => {
          if (touchTimeout) {
            clearTimeout(touchTimeout)
          }
          setIsTouching(true)
        }}
        onTouchEnd={() => {
          // 触摸结束后延迟隐藏，给用户时间完成操作
          const timeout = setTimeout(() => setIsTouching(false), 2000)
          setTouchTimeout(timeout)
        }}
        aria-label={isCollapsed ? t("nav.expandSidebar", "展开侧边栏") : t("nav.collapseSidebar", "收起侧边栏")}
        title={isCollapsed ? t("nav.expandSidebar", "展开侧边栏") : t("nav.collapseSidebar", "收起侧边栏")}
      >
        {isCollapsed ? (
          <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        ) : (
          <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        )}
      </Button>

      {/* 遮罩层 - 移动端展开时显示 */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden sidebar-overlay"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}
