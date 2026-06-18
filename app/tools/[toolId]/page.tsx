import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ALL_TOOL_META, TOOL_IDS } from "@/lib/config/tools.meta"
import { ToolView } from "./tool-view"
import { zh } from "@/lib/i18n/locales/zh"
import { en } from "@/lib/i18n/locales/en"

// 静态生成所有已知工具页面（+ 编译期固定路径，提高 TTFB）
export const dynamicParams = false

export function generateStaticParams() {
  return TOOL_IDS.map((toolId) => ({ toolId }))
}

// 通过点分隔 key 取嵌套字段
function lookup(obj: Record<string, unknown>, key: string): string | null {
  const parts = key.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else return null
  }
  return typeof cur === "string" ? cur : null
}

export async function generateMetadata(
  { params }: { params: Promise<{ toolId: string }> },
): Promise<Metadata> {
  const { toolId } = await params
  const meta = ALL_TOOL_META.find((t) => t.id === toolId)
  if (!meta) return { title: "Tool Not Found - BioTools" }

  const nameZh = lookup(zh as unknown as Record<string, unknown>, meta.nameKey) ?? meta.id
  const nameEn = lookup(en as unknown as Record<string, unknown>, meta.nameKey) ?? meta.id
  const descZh = lookup(zh as unknown as Record<string, unknown>, meta.descriptionKey) ?? ""
  const descEn = lookup(en as unknown as Record<string, unknown>, meta.descriptionKey) ?? ""

  const title = `${nameZh} | ${nameEn} - BioTools`
  const description = descEn || descZh

  return {
    title,
    description,
    alternates: {
      canonical: `/tools/${toolId}`,
    },
    openGraph: {
      title,
      description,
      url: `/tools/${toolId}`,
      type: "website",
      siteName: "BioTools",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default async function ToolPage(
  { params }: { params: Promise<{ toolId: string }> },
) {
  const { toolId } = await params
  const meta = ALL_TOOL_META.find((t) => t.id === toolId)
  if (!meta) notFound()

  return <ToolView toolId={toolId} />
}
