"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { zh } from "./locales/zh"

// zh 作为默认语言同步打包（与 <html lang="zh-CN"> 保持一致，避免首屏闪烁）
// 其他语言通过 dynamic import 切换 —— 不会进入首屏 chunk

export type Locale = "zh" | "en"

type Messages = typeof zh
const messagesCache: Record<Locale, Messages | null> = {
  zh,
  en: null,
}

const localeLoaders: Record<Exclude<Locale, "zh">, () => Promise<Messages>> = {
  en: () => import("./locales/en").then((m) => m.en as Messages),
}

interface I18nContextType {
  locale: Locale
  t: (key: string, fallback?: string) => string
  switchLocale: (newLocale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>("zh")
  // 用于触发重渲染（messagesCache 是模块级单例 + mutable）
  const [, setVersion] = useState(0)

  const t = useCallback((key: string, fallback?: string): string => {
    const dict = messagesCache[locale] ?? messagesCache.zh ?? zh
    const keys = key.split(".")
    let value: unknown = dict
    for (const k of keys) {
      if (value && typeof value === "object" && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return fallback || key
      }
    }
    return typeof value === "string" ? value : fallback || key
  }, [locale])

  const ensureLocale = useCallback(async (target: Locale) => {
    if (messagesCache[target]) return
    if (target === "zh") return
    const loader = localeLoaders[target as Exclude<Locale, "zh">]
    if (!loader) return
    const dict = await loader()
    messagesCache[target] = dict
    setVersion((v) => v + 1)
  }, [])

  const switchLocale = useCallback((newLocale: Locale) => {
    void ensureLocale(newLocale).then(() => {
      setLocale(newLocale)
      try {
        localStorage.setItem("biotools-locale", newLocale)
        document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en"
      } catch {
        // localStorage 在隐身模式或受限环境下可能不可用
      }
    })
  }, [ensureLocale])

  // 初始：从 localStorage 恢复偏好
  useEffect(() => {
    let saved: Locale | null = null
    try {
      saved = localStorage.getItem("biotools-locale") as Locale | null
    } catch {}
    if (saved && saved !== "zh" && (saved === "en")) {
      void ensureLocale(saved).then(() => {
        setLocale(saved!)
        document.documentElement.lang = "en"
      })
    } else {
      document.documentElement.lang = "zh-CN"
    }
  }, [ensureLocale])

  return (
    <I18nContext.Provider value={{ locale, t, switchLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
