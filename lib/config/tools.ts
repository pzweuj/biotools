// 向后兼容入口：把元数据 + 懒加载器组合成 ToolCategory。
// 旧代码继续 import { getToolCategories } 不变。
// 新代码（sidebar、sitemap、首页索引）应优先使用 lib/config/tools.meta。

import type { ToolCategory } from "@/types/tool"
import { TOOL_CATEGORIES, ALL_TOOL_META, TOOL_IDS } from "./tools.meta"
import { TOOL_LOADERS } from "./tools.loaders"

export { TOOL_CATEGORIES as TOOL_META_CATEGORIES, ALL_TOOL_META, TOOL_IDS }

export const getToolCategories = (): ToolCategory[] =>
  TOOL_CATEGORIES.map((cat) => ({
    id: cat.id,
    nameKey: cat.nameKey,
    tools: cat.tools.map((meta) => ({
      ...meta,
      component: TOOL_LOADERS[meta.id],
    })),
  }))

/** 按 id 取单个工具组件（路由懒加载用） */
export const getToolById = (id: string) => {
  const meta = ALL_TOOL_META.find((t) => t.id === id)
  if (!meta) return null
  return { ...meta, component: TOOL_LOADERS[id] }
}
