"use client"

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const scrollPositionRef = useRef<number>(0)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  // 初始化时检测是否为移动端，如果是则默认收起
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })
  const [isHovering, setIsHovering] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null)

  // 初始化 body 类名
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed')
      } else {
        document.body.classList.remove('sidebar-collapsed')
      }
    }
  }, []) // 只在挂载时执行一次

  // 保存滚动位置
  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      // 保存滚动位置到 sessionStorage
      sessionStorage.setItem('sidebar-scroll-position', viewport.scrollTop.toString())
      scrollPositionRef.current = viewport.scrollTop
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => {
      viewport.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 检测屏幕尺寸变化
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      const wasMobile = isMobile
      
      // 只在屏幕尺寸实际发生变化时处理
      if (wasMobile === mobile) {
        return
      }
      
      setIsMobile(mobile)
      
      if (wasMobile && !mobile && isCollapsed) {
        // 从移动端切换到桌面端时自动展开侧边栏
        setIsCollapsed(false)
        if (typeof document !== 'undefined') {
          document.body.classList.remove('sidebar-collapsed')
        }
      } else if (!wasMobile && mobile) {
        // 从桌面端切换到移动端时自动收起
        setIsCollapsed(true)
        if (typeof document !== 'undefined') {
          document.body.classList.add('sidebar-collapsed')
        }
      }
    }

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
      // 同步更新body类名
      if (typeof document !== 'undefined') {
        document.body.classList.add('sidebar-collapsed')
      }
    }
  }

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    
    // 动态更新body类名来控制主内容区域的布局
    if (typeof document !== 'undefined') {
      const body = document.body
      if (newCollapsedState) {
        body.classList.add('sidebar-collapsed')
      } else {
        body.classList.remove('sidebar-collapsed')
      }
    }
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

  // 恢复滚动位置（在组件挂载和工具列表更新后）
  // 使用 useLayoutEffect 在浏览器绘制前同步执行，避免闪烁
  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    // 从 sessionStorage 恢复滚动位置
    const savedPosition = sessionStorage.getItem('sidebar-scroll-position')
    if (savedPosition) {
      viewport.scrollTop = parseInt(savedPosition, 10)
    }
  }, [filteredTools.length])

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
            if (touchTimeout) {
              clearTimeout(touchTimeout)
            }
            setIsTouching(true)
          }}
        >
          <div className="w-1 h-8 bg-border/70 rounded-full animate-pulse" />
        </div>
      )}

      {/* 侧边栏容器 - 包含悬停检测 */}
      <div 
        className={cn(
          "fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-40 sidebar-transition overflow-hidden",
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

        <div 
          ref={scrollViewportRef}
          className="h-[calc(100vh-14rem)] overflow-y-auto"
        >
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
        </div>
        </div>
      </div>

      {/* 侧边栏切换按钮 - 位于侧边栏边缘中部 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-[calc(50vh+1.75rem)] -translate-y-1/2 z-[60] p-0 bg-background/90 backdrop-blur-sm border border-border shadow-md rounded-r-md rounded-l-none sidebar-transition hover:bg-muted cursor-pointer",
          // 移动端使用更大的按钮尺寸以便触摸
          isMobile ? "h-16 w-8 sidebar-toggle-button" : "h-12 w-6",
          isCollapsed 
            ? (isMobile ? "left-2" : "left-0")
            : "left-80",
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
        aria-label={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        title={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
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
