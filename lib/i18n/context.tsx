"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { zh } from "./locales/zh"
import { en } from "./locales/en"

export type Locale = "zh" | "en"

const messages = {
  zh,
  en,
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

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".")
    let value: any = messages[locale]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === "string" ? value : fallback || key
  }

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem("biotools-locale", newLocale)
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem("biotools-locale") as Locale
    if (savedLocale && ["zh", "en"].includes(savedLocale)) {
      setLocale(savedLocale)
    }
  }, [])

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
