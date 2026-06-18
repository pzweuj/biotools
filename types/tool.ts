import type React from "react"

export interface ToolMeta {
  id: string
  nameKey: string
  descriptionKey: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  /** 是否需要联网（外部 API / 跳转外站）。默认 false（纯本地计算） */
  external?: boolean
}

export interface Tool extends ToolMeta {
  component: React.ComponentType
}

export interface ToolCategory {
  id: string
  nameKey: string
  tools: Tool[]
}

export interface ToolMetaCategory {
  id: string
  nameKey: string
  tools: ToolMeta[]
}
