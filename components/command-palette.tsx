"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { useI18n } from "@/lib/i18n"
import { ALL_TOOL_META } from "@/lib/config/tools.meta"
import { Search, Star, Clock, Globe, Dna } from "lucide-react"

const RECENT_KEY = "biotools:recent-tools"
const FAVORITES_KEY = "biotools:favorites"
const MAX_RECENT = 6

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

function saveRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids))
  } catch {}
}

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

function toggleFavorite(id: string) {
  const current = loadFavorites()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  } catch {}
}

export function CommandPalette() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [search, setSearch] = useState("")

  // 加载已持久化的收藏 / 最近
  useEffect(() => {
    setFavorites(loadFavorites())
    setRecent(loadRecent())
  }, [])

  // 全局快捷键
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => {
          if (prev) return prev
          setSearch("")
          setFavorites(loadFavorites())
          setRecent(loadRecent())
          return true
        })
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const selectTool = useCallback(
    (toolId: string) => {
      // 记录最近使用
      const updated = [toolId, ...recent.filter((id) => id !== toolId)].slice(0, MAX_RECENT)
      setRecent(updated)
      saveRecent(updated)
      setOpen(false)
      router.push(`/tools/${toolId}`)
    },
    [recent, router],
  )

  const handleFavorite = useCallback((e: React.MouseEvent, toolId: string) => {
    e.stopPropagation()
    e.preventDefault()
    toggleFavorite(toolId)
    setFavorites(loadFavorites())
  }, [])

  // 过滤后的结果
  const results = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return ALL_TOOL_META
    return ALL_TOOL_META.filter(
      (tool) =>
        t(tool.nameKey).toLowerCase().includes(q) ||
        t(tool.descriptionKey).toLowerCase().includes(q) ||
        tool.id.includes(q) ||
        tool.category.includes(q),
    )
  }, [search, t])

  // 分区展示：收藏 → 最近 → 全量
  const favoriteTools = useMemo(
    () => results.filter((t) => favorites.includes(t.id)),
    [results, favorites],
  )
  const recentTools = useMemo(
    () =>
      recent
        .filter((id) => id && !favorites.includes(id))
        .map((id) => results.find((t) => t.id === id))
        .filter(Boolean),
    [results, recent, favorites],
  )
  const otherTools = useMemo(
    () =>
      search
        ? results.filter((t) => !favorites.includes(t.id) && !recent.includes(t.id))
        : results.filter((t) => !favorites.includes(t.id)),
    [results, favorites, recent, search],
  )

  const iconForTool = (tool: (typeof ALL_TOOL_META)[number]) => {
    const Icon = tool.icon
    return <Icon className="w-4 h-4" />
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSearch("")
      }}
      label={locale === "zh" ? "全局命令" : "Command Menu"}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
    >
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden font-mono">
        {/* 搜索栏 */}
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={locale === "zh" ? "搜索工具…" : "Search tools…"}
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
            {locale === "zh" ? "无匹配工具" : "No matching tools"}
          </Command.Empty>

          {/* 收藏分区 */}
          {favoriteTools.length > 0 && !search && (
            <Command.Group heading={locale === "zh" ? "⭐ 收藏" : "⭐ Favorites"}>
              {favoriteTools.map((tool) => (
                <Command.Item
                  key={tool.id}
                  value={`fav-${tool.id}`}
                  onSelect={() => selectTool(tool.id)}
                  className="flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                >
                  {iconForTool(tool)}
                  <span className="flex-1 truncate">{t(tool.nameKey)}</span>
                  {tool.external && <Globe className="w-3 h-3 text-muted-foreground" />}
                  <button
                    onClick={(e) => handleFavorite(e, tool.id)}
                    className="text-yellow-500 hover:text-yellow-600 ml-auto"
                    aria-label="Unfavorite"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* 最近使用分区 */}
          {recentTools.length > 0 && !search && (
            <Command.Group heading={locale === "zh" ? "🕐 最近" : "🕐 Recent"}>
              {recentTools.map((tool) =>
                tool ? (
                  <Command.Item
                    key={`recent-${tool.id}`}
                    value={`recent-${tool.id}`}
                    onSelect={() => selectTool(tool.id)}
                    className="flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    {iconForTool(tool)}
                    <span className="flex-1 truncate">{t(tool.nameKey)}</span>
                    {tool.external && <Globe className="w-3 h-3 text-muted-foreground" />}
                    <button
                      onClick={(e) => handleFavorite(e, tool.id)}
                      className="text-muted-foreground hover:text-yellow-500 ml-auto"
                      aria-label="Favorite"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  </Command.Item>
                ) : null,
              )}
            </Command.Group>
          )}

          {/* 全量结果 */}
          {otherTools.length > 0 && (
            <Command.Group heading={search ? (locale === "zh" ? "结果" : "Results") : (locale === "zh" ? "全部工具" : "All Tools")}>
              {otherTools.map((tool) => (
                <Command.Item
                  key={tool.id}
                  value={tool.id}
                  keywords={[t(tool.nameKey), t(tool.descriptionKey), tool.category]}
                  onSelect={() => selectTool(tool.id)}
                  className="flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                >
                  {iconForTool(tool)}
                  <div className="flex-1 truncate">
                    <span>{t(tool.nameKey)}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {t(tool.descriptionKey).slice(0, 40)}
                      {(t(tool.descriptionKey).length > 40) ? "…" : ""}
                    </span>
                  </div>
                  {tool.external && <Globe className="w-3 h-3 text-muted-foreground" />}
                  <button
                    onClick={(e) => handleFavorite(e, tool.id)}
                    className={
                      favorites.includes(tool.id)
                        ? "text-yellow-500 ml-auto"
                        : "text-muted-foreground hover:text-yellow-500 ml-auto"
                    }
                    aria-label={favorites.includes(tool.id) ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        favorites.includes(tool.id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* 底部提示 */}
        <div className="border-t px-3 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd>{" "}
            {locale === "zh" ? "导航" : "Navigate"}
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↵</kbd>{" "}
            {locale === "zh" ? "打开" : "Open"}
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Esc</kbd>{" "}
            {locale === "zh" ? "关闭" : "Close"}
          </span>
          <span className="ml-auto">
            <Star className="w-3 h-3 inline text-yellow-500" />{" "}
            {locale === "zh" ? "收藏" : "Favorite"}
          </span>
        </div>
      </div>
    </Command.Dialog>
  )
}
